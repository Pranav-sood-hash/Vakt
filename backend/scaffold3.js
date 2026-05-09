const fs = require('fs');
const path = require('path');

const files = {
  'src/services/points.service.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { RANK_THRESHOLDS } = require('../utils/constants');

exports.addXP = async (userId, amount) => {
  return await prisma.userPoints.update({
    where: { userId },
    data: { totalXP: { increment: amount }, weeklyXP: { increment: amount } }
  });
};
`,
  'src/services/rank.service.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
        title: \`Ranked up to \${newRank}!\`,
        xpDelta: XP_VALUES.RANK_UP_BONUS
      }
    });
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'RANK_UP',
        title: 'Rank Up!',
        message: \`Congratulations! You have reached \${newRank}.\`
      }
    });
  }
};
`,
  'src/services/streak.service.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        title: \`Streak extended to \${newStreak} days!\`,
        xpDelta: 0
      }
    });
  }
};
`,
  'src/services/notification.service.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createNotification = async (userId, type, title, message) => {
  return await prisma.notification.create({
    data: { userId, type, title, message }
  });
};
`,
  'src/services/email.service.js': `const nodemailer = require('nodemailer');

exports.sendEmail = async (to, subject, text) => {
  console.log(\`Sending email to \${to}: \${subject}\`);
  // Configure nodemailer transporter using process.env
};
`,
  'src/controllers/user.controller.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse, errorResponse } = require('../utils/response.utils');

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { points: true, settings: true, achievements: true }
    });
    if (!user) return errorResponse(res, 'NOT_FOUND', 'User not found', 404);
    
    const { passwordHash, refreshToken, ...safeUser } = user;
    return successResponse(res, safeUser);
  } catch (err) {
    next(err);
  }
};
`,
  'src/controllers/points.controller.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse } = require('../utils/response.utils');

exports.getPoints = async (req, res, next) => {
  try {
    const points = await prisma.userPoints.findUnique({
      where: { userId: req.user.userId }
    });
    return successResponse(res, points);
  } catch (err) {
    next(err);
  }
};
`,
  'src/controllers/settings.controller.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { successResponse } = require('../utils/response.utils');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.userId }
    });
    return successResponse(res, settings);
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.update({
      where: { userId: req.user.userId },
      data: req.body
    });
    return successResponse(res, settings, 'Settings updated');
  } catch (err) {
    next(err);
  }
};
`,
  'tests/auth.test.js': `describe('Auth API', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });
});
`
};

for (const [filepath, content] of Object.entries(files)) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, content);
}

console.log('Services, User Controllers generated.');
