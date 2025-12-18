const express = require('express');
const NutritionEntry = require('../models/NutritionEntry');
const auth = require('../middleware/auth');
const router = express.Router();

// Create nutrition entry
router.post('/', auth, async (req, res) => {
  try {
    const { mealType, name, calories, protein, carbs, fats, servingSize, servingUnit, date } = req.body;

    // Basic validation
    if (!mealType || !name || !calories || !servingSize || !servingUnit || !date) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['mealType', 'name', 'calories', 'servingSize', 'servingUnit', 'date']
      });
    }

    // Create the nutrition entry
    const entry = await NutritionEntry.create({
      userId: req.user.id,
      mealType,
      name: name.trim(),
      calories: Math.round(calories),
      protein: Math.round(protein || 0),
      carbs: Math.round(carbs || 0),
      fats: Math.round(fats || 0),
      servingSize: Math.round(servingSize),
      servingUnit: servingUnit.trim(),
      date
    });

    // Calculate daily totals
    const dailyEntries = await NutritionEntry.find({ 
      userId: req.user.id,
      date 
    });

    const summary = dailyEntries.reduce((acc, entry) => ({
      totalCalories: acc.totalCalories + (entry.calories || 0),
      totalProtein: acc.totalProtein + (entry.protein || 0),
      totalCarbs: acc.totalCarbs + (entry.carbs || 0),
      totalFats: acc.totalFats + (entry.fats || 0)
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0
    });

    res.status(201).json({ entry, summary });
  } catch (err) {
    console.error('Error creating nutrition entry:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily summary
router.get('/daily-summary', auth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const entries = await NutritionEntry.find({ 
      userId: req.user.id,
      date 
    });

    const summary = entries.reduce((acc, entry) => ({
      totalCalories: acc.totalCalories + (entry.calories || 0),
      totalProtein: acc.totalProtein + (entry.protein || 0),
      totalCarbs: acc.totalCarbs + (entry.carbs || 0),
      totalFats: acc.totalFats + (entry.fats || 0)
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0
    });

    res.json(summary);
  } catch (err) {
    console.error('Error getting daily summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nutrition entries for a specific date
router.get('/entries', auth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const entries = await NutritionEntry.find({ 
      userId: req.user.id,
      date 
    }).sort({ createdAt: 1 });

    res.json(entries);
  } catch (err) {
    console.error('Error getting nutrition entries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;