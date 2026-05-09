const prisma = require('../prisma');
const { successResponse, errorResponse } = require('../utils/response.utils');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, notifications);
  } catch (error) { next(error); }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    return successResponse(res, { count });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Notification not found', 404);

    const notif = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    return successResponse(res, notif);
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id },
      data: { isRead: true }
    });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (existing) {
      await prisma.notification.delete({ where: { id: req.params.id } });
    }
    return successResponse(res, null, 'Notification deleted');
  } catch (error) { next(error); }
};
