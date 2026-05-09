const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { subDays, startOfDay } = require('date-fns');

exports.getPoints = async (req, res, next) => {
  try {
    let points = await prisma.userPoints.findUnique({ where: { userId: req.user.id } });
    if (!points) {
      points = await prisma.userPoints.create({ data: { userId: req.user.id } });
    }
    return successResponse(res, points);
  } catch (error) { next(error); }
};

exports.getWeeklyHistory = async (req, res, next) => {
  try {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 6);

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });

    return successResponse(res, logs);
  } catch (error) { next(error); }
};
