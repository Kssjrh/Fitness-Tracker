const User = require('../models/User');

const updateStreak = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!user.lastCheckIn) {
      user.currentStreak = 1;
      user.longestStreak = 1;
      user.lastCheckIn = today;
    } else {
      const lastCheck = new Date(user.lastCheckIn);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCheck.toDateString() === yesterday.toDateString()) {
        // Consecutive day
        user.currentStreak += 1;
        user.longestStreak = Math.max(user.currentStreak, user.longestStreak);
        user.lastCheckIn = today;
      } else if (lastCheck.toDateString() !== today.toDateString()) {
        // Streak broken
        user.currentStreak = 1;
        user.lastCheckIn = today;
      }
    }
    
    await user.save();
    req.user = user;
    next();
  } catch (error) {
    console.error('Streak update error:', error);
    next();
  }
};

module.exports = { updateStreak };