const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { generateOTP, sendEmailChangeOTP, sendPasswordChangeOTP } = require('../services/email.service');
const path = require('path');
const fs = require('fs');

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        lastActiveDate: true
      }
    });
    if (!user) return errorResponse(res, 'NOT_FOUND', 'User not found', 404);
    return successResponse(res, user);
  } catch (error) { next(error); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowedFields = ['fullName', 'avatarUrl'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        lastActiveDate: true
      }
    });
    return successResponse(res, user, 'Profile updated');
  } catch (error) { next(error); }
};

exports.getActivity = async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return successResponse(res, logs);
  } catch (error) { next(error); }
};

exports.getStats = async (req, res, next) => {
  try {
    const points = await prisma.userPoints.findUnique({ where: { userId: req.user.id } });
    const tasksCompleted = await prisma.task.count({
      where: { userId: req.user.id, status: 'COMPLETED' }
    });
    const tasksPending = await prisma.task.count({
      where: { userId: req.user.id, status: 'PENDING' }
    });
    return successResponse(res, { points, tasksCompleted, tasksPending });
  } catch (error) { next(error); }
};

// --- NEW EDIT PROFILE METHODS ---

exports.sendEmailOTP = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return errorResponse(res, 'VALIDATION_ERROR', 'New email is required', 400);

    const existing = await prisma.user.findFirst({ where: { email: newEmail.toLowerCase() } });
    if (existing) return errorResponse(res, 'USER_EXISTS', 'Email already in use', 409);

    const otp = generateOTP();
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        emailOTP: otp,
        emailOTPExpiry: new Date(Date.now() + 10 * 60 * 1000),
        emailOTPNewEmail: newEmail.toLowerCase()
      }
    });

    await sendEmailChangeOTP(newEmail, otp);
    return successResponse(res, null, 'Verification code sent to new email');
  } catch (error) { next(error); }
};

exports.verifyEmailOTP = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.emailOTP || user.emailOTP !== code) {
      return errorResponse(res, 'INVALID_CODE', 'Invalid verification code', 400);
    }
    if (new Date() > user.emailOTPExpiry) {
      return errorResponse(res, 'EXPIRED_CODE', 'Code expired, please request a new one', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        email: user.emailOTPNewEmail,
        emailOTP: null,
        emailOTPExpiry: null,
        emailOTPNewEmail: null
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        type: 'ACHIEVEMENT',
        title: 'Email address updated',
        detail: `New email: ${updatedUser.email}`
      }
    });

    return successResponse(res, { newEmail: updatedUser.email }, 'Email updated successfully');
  } catch (error) { next(error); }
};

exports.sendPasswordOTP = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword !== confirmPassword) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Passwords must match', 400);
    }
    if (newPassword.length < 8) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Password must be at least 8 characters', 400);
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const otp = generateOTP();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordOTP: otp,
        passwordOTPExpiry: new Date(Date.now() + 10 * 60 * 1000),
        passwordOTPNew: passwordHash
      }
    });

    await sendPasswordChangeOTP(user.email, user.fullName, otp);
    return successResponse(res, null, 'Verification code sent to your email');
  } catch (error) { next(error); }
};

exports.verifyPasswordOTP = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.passwordOTP || user.passwordOTP !== code) {
      return errorResponse(res, 'INVALID_CODE', 'Invalid verification code', 400);
    }
    if (new Date() > user.passwordOTPExpiry) {
      return errorResponse(res, 'EXPIRED_CODE', 'Code expired, please request a new one', 400);
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: user.passwordOTPNew,
        passwordOTP: null,
        passwordOTPExpiry: null,
        passwordOTPNew: null,
        refreshToken: null // Force re-login
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        type: 'ACHIEVEMENT',
        title: 'Password changed',
        detail: 'Security credentials updated'
      }
    });

    return successResponse(res, null, 'Password updated. Please login again.');
  } catch (error) { next(error); }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'NO_FILE', 'No file uploaded', 400);

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });

    return successResponse(res, { avatarUrl: user.avatarUrl }, 'Avatar uploaded');
  } catch (error) { next(error); }
};

exports.deleteMe = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (user.username !== username) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Username confirmation failed', 400);
    }

    // Prisma Cascade handles deletion of related records (Task, TimetableSlot, etc.)
    // because I set 'onDelete: Cascade' in the schema.
    await prisma.user.delete({ where: { id: req.user.id } });

    return successResponse(res, null, 'Account deleted');
  } catch (error) { next(error); }
};
