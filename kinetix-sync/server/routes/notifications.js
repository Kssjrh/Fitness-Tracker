const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, isRead } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.user.id, isActive: true };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Notification.countDocuments(filter);
    
    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
      isActive: true
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create custom notification (for testing or admin use)
router.post('/', auth, async (req, res) => {
  try {
    const { type, category, title, message, priority = 'medium', actionUrl, actionText, metadata = {} } = req.body;
    
    if (!type || !category || !title || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['type', 'category', 'title', 'message']
      });
    }
    
    const notification = await Notification.create({
      userId: req.user.id,
      type,
      category,
      title,
      message,
      priority,
      actionUrl,
      actionText,
      metadata
    });
    
    res.status(201).json(notification);
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return notification settings from user document
    const settings = {
      mealReminders: user.notificationSettings?.mealReminders ?? true,
      workoutReminders: user.notificationSettings?.workoutReminders ?? true,
      mealReminderTime: user.notificationSettings?.mealReminderTime ?? '12:00',
      workoutReminderTime: user.notificationSettings?.workoutReminderTime ?? '18:00',
      reminderFrequency: user.notificationSettings?.reminderFrequency ?? 'daily',
      customDays: user.notificationSettings?.customDays ?? [1, 2, 3, 4, 5],
      achievementNotifications: user.notificationSettings?.achievementNotifications ?? true,
      streakNotifications: user.notificationSettings?.streakNotifications ?? true,
      progressNotifications: user.notificationSettings?.progressNotifications ?? true
    };
    
    res.json(settings);
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.patch('/settings', auth, async (req, res) => {
  try {
    const {
      mealReminders,
      workoutReminders,
      mealReminderTime,
      workoutReminderTime,
      reminderFrequency,
      customDays,
      achievementNotifications,
      streakNotifications,
      progressNotifications
    } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update notification settings
    user.notificationSettings = {
      ...user.notificationSettings,
      mealReminders,
      workoutReminders,
      mealReminderTime,
      workoutReminderTime,
      reminderFrequency,
      customDays,
      achievementNotifications,
      streakNotifications,
      progressNotifications
    };
    
    await user.save();
    
    res.json({ message: 'Notification settings updated', settings: user.notificationSettings });
  } catch (err) {
    console.error('Error updating notification settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create scheduled reminder
router.post('/schedule-reminder', auth, async (req, res) => {
  try {
    const { category, title, message, scheduledFor, actionUrl, actionText } = req.body;
    
    if (!category || !title || !message || !scheduledFor) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['category', 'title', 'message', 'scheduledFor']
      });
    }
    
    const notification = await Notification.createReminder(
      req.user.id,
      category,
      title,
      message,
      new Date(scheduledFor),
      actionUrl,
      actionText
    );
    
    res.status(201).json(notification);
  } catch (err) {
    console.error('Error scheduling reminder:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get scheduled notifications (for cron jobs)
router.get('/scheduled', async (req, res) => {
  try {
    const now = new Date();
    const scheduledNotifications = await Notification.find({
      scheduledFor: { $lte: now },
      isActive: true,
      sentAt: { $exists: false }
    }).populate('userId', 'name email');
    
    res.json(scheduledNotifications);
  } catch (err) {
    console.error('Error fetching scheduled notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as sent
router.patch('/:id/sent', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { sentAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as sent:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

