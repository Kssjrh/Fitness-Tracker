const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: { type: Number },
    weight: { type: Number },
    goals: [{ type: String }],
    joinDate: { type: Date, default: Date.now },
    bmiData: {
      bmi: { type: Number },
      lastUpdated: { type: Date },
      calorieGoal: { type: Number },
      proteinGoal: { type: Number },
      carbsGoal: { type: Number },
      fatsGoal: { type: Number },
      weeklyWorkoutGoal: { type: Number, default: 4 }
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCheckIn: { type: Date },
    weeklyProgress: {
      type: Map,
      of: {
        caloriesConsumed: Number,
        calorieGoalMet: Boolean,
        date: Date
      },
      default: new Map()
    },
    weeklyCalorieBalance: {
      type: Map,
      of: Number,
      default: new Map()
    },
    // New fields for advanced features
    fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    activityLevel: { type: String, enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'], default: 'sedentary' },
    preferences: {
      dietaryRestrictions: [{ type: String }],
      favoriteExercises: [{ type: String }],
      workoutDuration: { type: Number, default: 60 }, // preferred workout duration in minutes
      workoutDays: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
      mealPreferences: {
        breakfastTime: { type: String },
        lunchTime: { type: String },
        dinnerTime: { type: String },
        snackTimes: [{ type: String }],
        mealsPerDay: { type: Number, default: 3 }
      }
    },
    statistics: {
      totalWorkouts: { type: Number, default: 0 },
      totalCaloriesBurned: { type: Number, default: 0 },
      averageWorkoutDuration: { type: Number, default: 0 },
      personalBests: {
        type: Map,
        of: {
          value: Number,
          date: Date,
          exercise: String
        }
      }
    },
    aiPreferences: {
      difficultyProgression: { type: String, enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' },
      focusAreas: [{ type: String }],
      equipmentAvailable: [{ type: String }],
      workoutLocation: { type: String, enum: ['home', 'gym', 'outdoor'], default: 'home' }
    },
    notificationSettings: {
      mealReminders: { type: Boolean, default: true },
      workoutReminders: { type: Boolean, default: true },
      mealReminderTime: { type: String, default: '12:00' },
      workoutReminderTime: { type: String, default: '18:00' },
      reminderFrequency: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
      customDays: [{ type: Number, min: 0, max: 6 }], // 0-6 for Sunday-Saturday
      achievementNotifications: { type: Boolean, default: true },
      streakNotifications: { type: Boolean, default: true },
      progressNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


