const cron = require('node-cron');
const prisma = require('../prisma');

exports.init = () => {
  // expiredTasks: runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running expired tasks cron...');
    try {
      await prisma.task.updateMany({
        where: {
          status: 'PENDING',
          dueDateTime: { lt: new Date() }
        },
        data: { status: 'EXPIRED' }
      });
    } catch (err) {
      console.error('Expired tasks cron error:', err.message);
    }
  });

  // dailyReset: runs at 00:00 daily
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily reset cron...');
    try {
      await prisma.userPoints.updateMany({
        data: { weeklyXP: 0 }
      });
    } catch (err) {
      console.error('Daily reset cron error:', err.message);
    }
  });

  // streakCheck: runs at 00:01 daily
  cron.schedule('1 0 * * *', async () => {
    console.log('Running streak check cron...');
    // implementation
  });
};
