const express = require('express');
const User = require('../models/User');
const Workout = require('../models/Workout');
const NutritionEntry = require('../models/NutritionEntry');
const auth = require('../middleware/auth');
const router = express.Router();

// Clear all workout data
router.delete('/workouts/clear', auth, async (req, res) => {
  try {
    await Workout.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: 'All workout data cleared successfully' });
  } catch (err) {
    console.error('Error clearing workouts:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all nutrition data
router.delete('/nutrition/clear', auth, async (req, res) => {
  try {
    await NutritionEntry.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: 'All nutrition data cleared successfully' });
  } catch (err) {
    console.error('Error clearing nutrition data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear BMI data
router.delete('/bmi/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.bmiData = null;
    await user.save();
    
    res.status(200).json({ message: 'BMI data cleared successfully' });
  } catch (err) {
    console.error('Error clearing BMI data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all user data
router.delete('/clear-all', auth, async (req, res) => {
  try {
    // Clear all data types
    await Promise.all([
      Workout.deleteMany({ userId: req.user.id }),
      NutritionEntry.deleteMany({ userId: req.user.id })
    ]);

    // Clear BMI data from user profile
    const user = await User.findById(req.user.id);
    if (user) {
      user.bmiData = null;
      await user.save();
    }

    res.status(200).json({ message: 'All data cleared successfully' });
  } catch (err) {
    console.error('Error clearing all data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account
router.delete('/account/delete', auth, async (req, res) => {
  try {
    // Delete all user data
    await Promise.all([
      Workout.deleteMany({ userId: req.user.id }),
      NutritionEntry.deleteMany({ userId: req.user.id }),
      User.findByIdAndDelete(req.user.id)
    ]);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get data statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [workoutCount, nutritionCount, user] = await Promise.all([
      Workout.countDocuments({ userId: req.user.id }),
      NutritionEntry.countDocuments({ userId: req.user.id }),
      User.findById(req.user.id)
    ]);

    // Calculate unique active days
    const [workouts, nutrition] = await Promise.all([
      Workout.find({ userId: req.user.id }, 'date'),
      NutritionEntry.find({ userId: req.user.id }, 'date')
    ]);

    const activeDays = new Set([
      ...workouts.map(w => w.date),
      ...nutrition.map(n => n.date)
    ]).size;

    res.status(200).json({
      workouts: workoutCount,
      nutrition: nutritionCount,
      daysActive: activeDays,
      totalRecords: workoutCount + nutritionCount,
      hasBMIData: !!user?.bmiData
    });
  } catch (err) {
    console.error('Error getting data stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export all user data
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const [user, workouts, nutrition, bmiData] = await Promise.all([
      User.findById(req.user.id),
      Workout.find({ userId: req.user.id }),
      NutritionEntry.find({ userId: req.user.id })
    ]);

    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
        calorieGoal: user.calorieGoal,
        proteinGoal: user.proteinGoal
      },
      bmiData: user.bmiData,
      workouts: workouts,
      nutrition: nutrition,
      exportDate: new Date().toISOString(),
      format: format,
      version: '1.0'
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fittracker-data-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fittracker-data-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      res.json(exportData);
    }
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  const headers = ['Date', 'Type', 'Name', 'Calories', 'Protein', 'Carbs', 'Fats'];
  const rows = [headers.join(',')];

  // Add workout data
  if (data.workouts) {
    data.workouts.forEach(workout => {
      rows.push([
        workout.date,
        'Workout',
        workout.type,
        workout.calories || 0,
        0,
        0,
        0
      ].join(','));
    });
  }

  // Add nutrition data
  if (data.nutrition) {
    data.nutrition.forEach(meal => {
      rows.push([
        meal.date,
        'Meal',
        meal.name,
        meal.calories || 0,
        meal.protein || 0,
        meal.carbs || 0,
        meal.fats || 0
      ].join(','));
    });
  }

  return rows.join('\n');
}

module.exports = router;

