const prisma = require('../prisma');

exports.updateStreak = async (userId) => {
  const points = await prisma.userPoints.findUnique({ where: { userId } });
  if (!points) return;
  
  const now = new Date();
  const lastDate = points.lastStreakDate;
  
  // if lastDate is not today, increment
  if (!lastDate || lastDate.getDate() !== now.getDate()) {
    const newStreak = points.streak + 1;
    const newLongest = Math.max(newStreak, points.longestStreak);
    
    await prisma.userPoints.update({
      where: { userId },
      data: { streak: newStreak, longestStreak: newLongest, lastStreakDate: now }
    });
    
    await prisma.activityLog.create({
      data: {
        userId,
        type: 'STREAK_UPDATE',
        title: `Streak extended to ${newStreak} days!`,
        xpDelta: 0
      }
    });
  }
};
