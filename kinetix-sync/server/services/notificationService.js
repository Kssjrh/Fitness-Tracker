const Notification = require('../models/Notification');
const User = require('../models/User');
const Workout = require('../models/Workout');
const NutritionEntry = require('../models/NutritionEntry');

class NotificationService {
  // Create meal reminder notification
  static async createMealReminder(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.mealReminders) return null;

      const today = new Date().toISOString().split('T')[0];
      const todayMeals = await NutritionEntry.find({
        userId,
        date: today
      });

      // Only create reminder if no meals logged today
      if (todayMeals.length === 0) {
        return await Notification.createReminder(
          userId,
          'meal',
          '🍽️ Meal Logging Reminder',
          "Don't forget to log your meals today! Track your nutrition to stay on top of your goals.",
          new Date(),
          '/nutrition',
          'Log Meals'
        );
      }
      return null;
    } catch (error) {
      console.error('Error creating meal reminder:', error);
      return null;
    }
  }

  // Create workout reminder notification
  static async createWorkoutReminder(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.workoutReminders) return null;

      const today = new Date().toISOString().split('T')[0];
      const todayWorkouts = await Workout.find({
        userId,
        date: today
      });

      // Only create reminder if no workouts logged today
      if (todayWorkouts.length === 0) {
        return await Notification.createReminder(
          userId,
          'workout',
          '💪 Workout Reminder',
          "Time to get moving! Log your workout to track your fitness progress.",
          new Date(),
          '/workouts',
          'Log Workout'
        );
      }
      return null;
    } catch (error) {
      console.error('Error creating workout reminder:', error);
      return null;
    }
  }

  // Create streak achievement notification
  static async createStreakNotification(userId, streakCount) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.streakNotifications) return null;

      const messages = {
        3: "Great start! You're building momentum!",
        7: "One week strong! You're on fire! 🔥",
        14: "Two weeks! You're becoming unstoppable!",
        30: "One month! You're a fitness champion! 🏆",
        60: "Two months! You're an inspiration!",
        100: "100 days! You're a legend! 🎉"
      };

      const message = messages[streakCount] || `Amazing ${streakCount} day streak! Keep it up!`;

      return await Notification.createStreak(userId, streakCount, message);
    } catch (error) {
      console.error('Error creating streak notification:', error);
      return null;
    }
  }

  // Create goal achievement notification
  static async createGoalAchievement(userId, goalType, goalValue) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.achievementNotifications) return null;

      const achievements = {
        calorieGoal: {
          title: '🎯 Calorie Goal Achieved!',
          message: `Congratulations! You've reached your daily calorie goal of ${goalValue} calories!`
        },
        proteinGoal: {
          title: '💪 Protein Goal Crushed!',
          message: `Amazing! You've hit your protein target of ${goalValue}g today!`
        },
        workoutGoal: {
          title: '🏋️ Workout Goal Completed!',
          message: `Fantastic! You've completed your weekly workout goal of ${goalValue} sessions!`
        }
      };

      const achievement = achievements[goalType];
      if (!achievement) return null;

      return await Notification.createAchievement(
        userId,
        achievement.title,
        achievement.message,
        { goalType, goalValue }
      );
    } catch (error) {
      console.error('Error creating goal achievement:', error);
      return null;
    }
  }

  // Create progress milestone notification
  static async createProgressMilestone(userId, milestone, value) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.progressNotifications) return null;

      const milestones = {
        weightLoss: {
          title: '📉 Weight Loss Milestone!',
          message: `Congratulations! You've lost ${value}kg! Your dedication is paying off!`
        },
        muscleGain: {
          title: '💪 Muscle Gain Achievement!',
          message: `Incredible! You've gained ${value}kg of muscle! You're getting stronger!`
        },
        fitnessImprovement: {
          title: '🚀 Fitness Level Up!',
          message: `Amazing progress! You've improved your fitness level to ${value}!`
        }
      };

      const milestoneData = milestones[milestone];
      if (!milestoneData) return null;

      return await Notification.createAchievement(
        userId,
        milestoneData.title,
        milestoneData.message,
        { milestone, value }
      );
    } catch (error) {
      console.error('Error creating progress milestone:', error);
      return null;
    }
  }

  // Create motivational notification
  static async createMotivationalNotification(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notificationSettings?.progressNotifications) return null;

      const motivationalMessages = [
        {
          title: '🌟 You\'re Doing Great!',
          message: 'Every small step counts towards your fitness goals. Keep pushing forward!'
        },
        {
          title: '💪 Stay Strong!',
          message: 'Consistency is key to success. You\'re building healthy habits that will last a lifetime!'
        },
        {
          title: '🎯 Focus on Progress!',
          message: 'Remember, fitness is a journey, not a destination. Celebrate every victory!'
        },
        {
          title: '🔥 Keep the Momentum!',
          message: 'Your dedication is inspiring! Every workout and meal choice matters!'
        }
      ];

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

      return await Notification.create({
        userId,
        type: 'motivation',
        category: 'progress',
        title: randomMessage.title,
        message: randomMessage.message,
        priority: 'low'
      });
    } catch (error) {
      console.error('Error creating motivational notification:', error);
      return null;
    }
  }

  // Check and create daily reminders based on user settings
  static async checkAndCreateDailyReminders() {
    try {
      const users = await User.find({
        'notificationSettings.mealReminders': true,
        'notificationSettings.workoutReminders': true
      });

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDay = now.getDay();

      for (const user of users) {
        const settings = user.notificationSettings;
        
        // Check if we should show reminders today
        let shouldShowToday = false;
        switch (settings.reminderFrequency) {
          case 'daily':
            shouldShowToday = true;
            break;
          case 'weekly':
            shouldShowToday = currentDay === 1; // Monday
            break;
          case 'custom':
            shouldShowToday = settings.customDays?.includes(currentDay) || false;
            break;
        }

        if (!shouldShowToday) continue;

        // Check meal reminder
        if (settings.mealReminders && currentTime === settings.mealReminderTime) {
          await this.createMealReminder(user._id);
        }

        // Check workout reminder
        if (settings.workoutReminders && currentTime === settings.workoutReminderTime) {
          await this.createWorkoutReminder(user._id);
        }
      }
    } catch (error) {
      console.error('Error checking daily reminders:', error);
    }
  }

  // Clean up old notifications
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await Notification.updateMany(
        {
          createdAt: { $lt: thirtyDaysAgo },
          isRead: true
        },
        { isActive: false }
      );

      console.log('Old notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}

module.exports = NotificationService;

