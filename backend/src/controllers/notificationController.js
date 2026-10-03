const notificationService = require('../services/notificationService');

async function getMyNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      status: 'success',
      unreadCount,
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

async function clearNotification(req, res, next) {
  try {
    const { id } = req.params;
    await notificationService.clearNotification(id, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
}

async function clearAllNotifications(req, res, next) {
  try {
    await notificationService.clearAllNotifications(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'All notifications cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  clearNotification,
  clearAllNotifications
};
