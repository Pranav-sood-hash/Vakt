const prisma = require('../prisma');

exports.createNotification = async (userId, type, title, message) => {
  return await prisma.notification.create({
    data: { userId, type, title, message }
  });
};
