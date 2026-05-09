const prisma = require('../prisma');
const { RANK_THRESHOLDS, XP_VALUES } = require('../utils/constants');

exports.checkRankUp = async (userId, currentTotalXP) => {
  const points = await prisma.userPoints.findUnique({ where: { userId } });
  if (!points) return;
  
  let newRank = points.currentRank;
  let newRankLevel = points.rankLevel;
  
  const ranks = Object.keys(RANK_THRESHOLDS);
  for (let i = 0; i < ranks.length; i++) {
    if (currentTotalXP >= RANK_THRESHOLDS[ranks[i]]) {
      newRank = ranks[i];
      newRankLevel = i + 1;
    }
  }

  if (newRank !== points.currentRank) {
    await prisma.userPoints.update({
      where: { userId },
      data: { currentRank: newRank, rankLevel: newRankLevel, totalXP: { increment: XP_VALUES.RANK_UP_BONUS } }
    });
    
    await prisma.activityLog.create({
      data: {
        userId,
        type: 'RANK_UP',
        title: `Ranked up to ${newRank}!`,
        xpDelta: XP_VALUES.RANK_UP_BONUS
      }
    });
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'RANK_UP',
        title: 'Rank Up!',
        message: `Congratulations! You have reached ${newRank}.`
      }
    });
  }
};
