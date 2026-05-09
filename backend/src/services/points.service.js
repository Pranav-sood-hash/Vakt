const prisma = require('../prisma');
const { RANK_THRESHOLDS } = require('../utils/constants');

exports.addXP = async (userId, amount) => {
  return await prisma.userPoints.update({
    where: { userId },
    data: { totalXP: { increment: amount }, weeklyXP: { increment: amount } }
  });
};
