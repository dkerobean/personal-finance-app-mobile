const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { sendNotification } = require('../services/onesignal');

// GET /api/notifications - Get all notifications for a user
router.get('/', async (req, res) => {
  try {
    const { userId, unreadOnly } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({ 
      data: notifications,
      unreadCount 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ data: { count } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications - Create a notification (for internal/system use)
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, data, priority } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'userId, type, title, and message are required' });
    }

    // ... existing code ...

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      priority: priority || 'medium',
    });

    await notification.save();

    // Send Push Notification
    // We strive to send push for all notifications created via this endpoint
    // The OneSignal service handles the check for missing keys
    try {
      await sendNotification({
        include_external_user_ids: [userId],
        title,
        message,
        data: { ...data, notificationId: notification._id }
      });
    } catch (pushError) {
      console.error('Failed to send push notification:', pushError);
      // We don't fail the request if push fails
    }

    res.status(201).json({ data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
