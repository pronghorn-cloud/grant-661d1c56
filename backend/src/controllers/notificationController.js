import * as notificationService from '../services/notificationService.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const unreadOnly = req.query.unread === 'true';

    const notifications = await notificationService.getUserNotifications(userId, { limit, offset, unreadOnly });
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
}

export async function markAsRead(req, res) {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
}
