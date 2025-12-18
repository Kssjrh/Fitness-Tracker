const express = require('express');
const User = require('../models/User');
const router = express.Router();
const auth = require('../middleware/auth');

// Update BMI and nutrition goals
router.post('/', auth, async (req, res) => {
  try {
    const {
      bmi,
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatsGoal,
      weeklyWorkoutGoal,
      weight,
      height
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's weight and height if provided
    if (weight !== undefined) {
      user.weight = weight;
    }
    if (height !== undefined) {
      user.height = height;
    }

    user.bmiData = {
      bmi,
      lastUpdated: new Date(),
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatsGoal,
      weeklyWorkoutGoal: weeklyWorkoutGoal || 4
    };

    await user.save();
    res.status(200).json({ 
      bmiData: user.bmiData,
      user: {
        id: user._id.toString(),
        weight: user.weight,
        height: user.height,
        bmiData: user.bmiData
      }
    });
  } catch (err) {
    console.error('Error updating BMI:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's BMI data
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.bmiData || {});
  } catch (err) {
    console.error('Error getting BMI:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;