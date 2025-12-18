const express = require('express');
const CronService = require('../services/cronService');
const router = express.Router();

// Process scheduled notifications
router.post('/process-notifications', async (req, res) => {
  try {
    const count = await CronService.processScheduledNotifications();
    res.json({ 
      message: 'Scheduled notifications processed',
      count 
    });
  } catch (err) {
    console.error('Error processing scheduled notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create daily reminders
router.post('/daily-reminders', async (req, res) => {
  try {
    await CronService.createDailyReminders();
    res.json({ message: 'Daily reminders created' });
  } catch (err) {
    console.error('Error creating daily reminders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cleanup old notifications
router.post('/cleanup', async (req, res) => {
  try {
    await CronService.cleanupOldNotifications();
    res.json({ message: 'Old notifications cleaned up' });
  } catch (err) {
    console.error('Error cleaning up notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check achievements
router.post('/achievements', async (req, res) => {
  try {
    await CronService.checkAchievements();
    res.json({ message: 'Achievement check completed' });
  } catch (err) {
    console.error('Error checking achievements:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send motivational notifications
router.post('/motivational', async (req, res) => {
  try {
    await CronService.sendMotivationalNotifications();
    res.json({ message: 'Motivational notifications sent' });
  } catch (err) {
    console.error('Error sending motivational notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Run all cron jobs
router.post('/run-all', async (req, res) => {
  try {
    const results = {
      notifications: await CronService.processScheduledNotifications(),
      reminders: 'Daily reminders created',
      cleanup: 'Old notifications cleaned up',
      achievements: 'Achievement check completed',
      motivational: 'Motivational notifications sent'
    };

    await Promise.all([
      CronService.createDailyReminders(),
      CronService.cleanupOldNotifications(),
      CronService.checkAchievements(),
      CronService.sendMotivationalNotifications()
    ]);

    res.json({ 
      message: 'All cron jobs completed',
      results 
    });
  } catch (err) {
    console.error('Error running cron jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

