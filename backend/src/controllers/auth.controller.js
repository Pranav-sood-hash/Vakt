const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  });
  return { accessToken, refreshToken };
};

exports.signup = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (!fullName || !username || !email || !password) {
      return errorResponse(res, 'VALIDATION_ERROR', 'All fields are required', 400);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] }
    });
    if (existing) return errorResponse(res, 'USER_EXISTS', 'Email or username already in use', 409);

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash
      }
    });

    // Create companion documents
    await prisma.userPoints.create({ data: { userId: user.id } });
    await prisma.userSettings.create({ data: { userId: user.id } });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'ACHIEVEMENT',
        title: 'Account Created',
        detail: 'Welcome to Vakt'
      }
    });

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: { id: user.id, fullName: user.fullName, username: user.username, email: user.email }
    }, 'Signup successful', 201);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 'VALIDATION_ERROR', 'Email and password required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastActiveDate: new Date() }
    });

    const points = await prisma.userPoints.findUnique({ where: { userId: user.id } });
    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: { id: user.id, fullName: user.fullName, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
      points,
      settings
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });
    }
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'MISSING_TOKEN', 'Refresh token required', 400);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== refreshToken) {
      return errorResponse(res, 'INVALID_TOKEN', 'Refresh token is invalid', 401);
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefresh }
    });

    return successResponse(res, { accessToken, refreshToken: newRefresh }, 'Tokens refreshed');
  } catch (error) {
    return errorResponse(res, 'INVALID_TOKEN', 'Refresh token expired or invalid', 401);
  }
};

const { generateOTP, sendForgotPasswordOTP, sendPasswordResetSuccess } = require('../services/email.service');

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    if (!user) {
      return errorResponse(res, 'NOT_FOUND', 'No account found with this email address', 404);
    }

    const otp = generateOTP();
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hashedOtp = await bcrypt.hash(otp, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOTP: hashedOtp,
        passwordResetOTPExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 min
      }
    });

    await sendForgotPasswordOTP(user.email, user.fullName, otp);

    return successResponse(res, null, 'Verification code sent to email');
  } catch (error) { next(error); }
};

exports.verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return errorResponse(res, 'INVALID_OTP', 'Invalid verification code', 400);
    }

    if (new Date() > user.passwordResetOTPExpiry) {
      return errorResponse(res, 'EXPIRED_OTP', 'Code expired. Please request a new one.', 400);
    }

    const isMatch = await bcrypt.compare(otp, user.passwordResetOTP);
    if (!isMatch) {
      return errorResponse(res, 'INVALID_OTP', 'Invalid verification code', 400);
    }

    // Generate short-lived reset token (JWT, 15min)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset' }, 
      process.env.JWT_RESET_SECRET, 
      { expiresIn: '15m' }
    );

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hashedResetToken = await bcrypt.hash(resetToken, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetOTP: null,
        passwordResetOTPExpiry: null
      }
    });

    return successResponse(res, { resetToken }, 'OTP verified successfully');
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Passwords do not match', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_RESET_SECRET);
    } catch (err) {
      return errorResponse(res, 'SESSION_EXPIRED', 'Session expired. Please start over.', 401);
    }

    if (decoded.purpose !== 'reset') {
      return errorResponse(res, 'INVALID_TOKEN', 'Invalid reset token', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.passwordResetToken) {
      return errorResponse(res, 'SESSION_EXPIRED', 'Session expired. Please start over.', 401);
    }

    const isTokenMatch = await bcrypt.compare(resetToken, user.passwordResetToken);
    if (!isTokenMatch) {
      return errorResponse(res, 'INVALID_TOKEN', 'Invalid or already used reset token', 401);
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        refreshToken: null // Invalidate all active sessions
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'SECURITY',
        title: 'Password Reset',
        detail: 'Password reset via email'
      }
    });

    await sendPasswordResetSuccess(user.email, user.fullName);

    return successResponse(res, null, 'Password updated successfully');
  } catch (error) { next(error); }
};
