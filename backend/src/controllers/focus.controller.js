const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { startOfDay } = require('date-fns');

exports.startFocus = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Focus session started');
  } catch (error) { next(error); }
};

exports.endFocus = async (req, res, next) => {
  try {
    const { taskId, durationMin, xpAwarded } = req.body;
    if (!durationMin) return errorResponse(res, 'VALIDATION_ERROR', 'durationMin required', 400);

    const session = await prisma.focusSession.create({
      data: {
        userId: req.user.id,
        taskId: taskId || null,
        durationMin,
        xpAwarded: xpAwarded || 0,
        completedAt: new Date()
      }
    });

    // Update user points and stats
    await prisma.userPoints.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        totalXP: xpAwarded || 0,
        totalFocusMin: durationMin
      },
      update: {
        totalXP: { increment: xpAwarded || 0 },
        totalFocusMin: { increment: durationMin }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        type: 'FOCUS_COMPLETE',
        title: `Completed ${durationMin} min focus session`,
        detail: `Earned ${xpAwarded} XP`,
        xpDelta: xpAwarded || 0
      }
    });

    return successResponse(res, session, 'Focus session ended');
  } catch (error) { next(error); }
};

exports.getTodayStats = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: today }
      }
    });

    const totalMin = sessions.reduce((acc, s) => acc + s.durationMin, 0);
    const totalXP = sessions.reduce((acc, s) => acc + s.xpAwarded, 0);

    return successResponse(res, { totalMin, totalXP, sessionCount: sessions.length });
  } catch (error) { next(error); }
};
