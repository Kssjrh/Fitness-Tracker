const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    enum: ['reminder', 'achievement', 'goal', 'streak', 'motivation', 'system'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['meal', 'workout', 'progress', 'achievement', 'reminder', 'system'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  actionUrl: { type: String }, // URL to navigate to when notification is clicked
  actionText: { type: String }, // Text for action button
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }, // Additional data like streak count, achievement details, etc.
  scheduledFor: { type: Date }, // For scheduled notifications
  expiresAt: { type: Date }, // When notification should expire
  sentAt: { type: Date }, // When notification was actually sent
  readAt: { type: Date } // When notification was read
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, isActive: 1 });
notificationSchema.index({ scheduledFor: 1, isActive: 1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Static method to create reminder notification
notificationSchema.statics.createReminder = function(userId, category, title, message, scheduledFor, actionUrl, actionText) {
  return this.create({
    userId,
    type: 'reminder',
    category,
    title,
    message,
    scheduledFor,
    actionUrl,
    actionText,
    priority: 'medium'
  });
};

// Static method to create achievement notification
notificationSchema.statics.createAchievement = function(userId, title, message, metadata = {}) {
  return this.create({
    userId,
    type: 'achievement',
    category: 'achievement',
    title,
    message,
    metadata,
    priority: 'high'
  });
};

// Static method to create streak notification
notificationSchema.statics.createStreak = function(userId, streakCount, message) {
  return this.create({
    userId,
    type: 'streak',
    category: 'progress',
    title: `🔥 ${streakCount} Day Streak!`,
    message,
    metadata: { streakCount },
    priority: 'high'
  });
};

module.exports = mongoose.model('Notification', notificationSchema);

