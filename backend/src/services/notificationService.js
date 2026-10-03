const prisma = require('../config/prisma');

async function createNotification(userId, applicationId, message) {
  if (!userId) return null;
  return await prisma.notification.create({
    data: {
      userId,
      applicationId,
      message,
      isRead: false
    }
  });
}

async function getUserNotifications(userId) {
  return await prisma.notification.findMany({
    where: { userId },
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          type: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function markAsRead(notificationId, userId) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
}

async function markAllAsRead(userId) {
  return await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true }
  });
}

async function clearNotification(notificationId, userId) {
  return await prisma.notification.deleteMany({
    where: { id: notificationId, userId }
  });
}

async function clearAllNotifications(userId) {
  return await prisma.notification.deleteMany({
    where: { userId }
  });
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications
};
