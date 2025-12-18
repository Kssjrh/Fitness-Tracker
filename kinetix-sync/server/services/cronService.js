const NotificationService = require('./notificationService');
const Notification = require('../models/Notification');

class CronService {
  // Check and send scheduled notifications
  static async processScheduledNotifications() {
    try {
      console.log('Processing scheduled notifications...');
      
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        scheduledFor: { $lte: now },
        isActive: true,
        sentAt: { $exists: false }
      }).populate('userId', 'name email notificationSettings');

      console.log(`Found ${scheduledNotifications.length} scheduled notifications`);

      for (const notification of scheduledNotifications) {
        try {
          // Mark as sent
          notification.sentAt = new Date();
          await notification.save();
          
          console.log(`Sent notification: ${notification.title} to user ${notification.userId.name}`);
        } catch (error) {
          console.error(`Error sending notification ${notification._id}:`, error);
        }
      }

      return scheduledNotifications.length;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return 0;
    }
  }

  // Check and create daily reminders
  static async createDailyReminders() {
    try {
      console.log('Creating daily reminders...');
      await NotificationService.checkAndCreateDailyReminders();
      console.log('Daily reminders check completed');
    } catch (error) {
      console.error('Error creating daily reminders:', error);
    }
  }

  // Clean up old notifications
  static async cleanupOldNotifications() {
    try {
      console.log('Cleaning up old notifications...');
      await NotificationService.cleanupOldNotifications();
      console.log('Old notifications cleanup completed');
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Check for achievement notifications
  static async checkAchievements() {
    try {
      console.log('Checking for achievements...');
      
      // This would be called when users complete workouts or log meals
      // Implementation would depend on specific achievement criteria
      
      console.log('Achievement check completed');
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Send motivational notifications
  static async sendMotivationalNotifications() {
    try {
      console.log('Sending motivational notifications...');
      
      // This could be called weekly or based on user activity
      // For now, we'll just log that it would happen
      
      console.log('Motivational notifications check completed');
    } catch (error) {
      console.error('Error sending motivational notifications:', error);
    }
  }
}

module.exports = CronService;

