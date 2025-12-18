const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Measurement = require('../models/Measurement');
const Workout = require('../models/Workout');
const NutritionEntry = require('../models/NutritionEntry');

// Get analytics summary
router.get('/summary', auth, async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const [measurements, workouts, nutrition] = await Promise.all([
      Measurement.find({
        userId: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 }),
      Workout.find({
        userId: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      }),
      NutritionEntry.find({
        userId: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      })
    ]);

    // Calculate trends and statistics
    const stats = {
      weightTrend: measurements.map(m => ({ date: m.date, value: m.weight })),
      totalWorkouts: workouts.length,
      averageCalories: nutrition.reduce((acc, entry) => acc + entry.calories, 0) / nutrition.length || 0,
      workoutsByType: workouts.reduce((acc, w) => {
        acc[w.type] = (acc[w.type] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// Record new measurement
router.post('/measurements', auth, async (req, res) => {
  try {
    const measurement = await Measurement.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(measurement);
  } catch (error) {
    console.error('Measurement error:', error);
    res.status(500).json({ message: 'Error recording measurement' });
  }
});

// Get measurement history
router.get('/measurements', auth, async (req, res) => {
  try {
    const measurements = await Measurement.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(100);
    res.json(measurements);
  } catch (error) {
    console.error('Measurement fetch error:', error);
    res.status(500).json({ message: 'Error fetching measurements' });
  }
});

// Get detailed progress analysis
router.get('/progress', auth, async (req, res) => {
  try {
    const { metric, startDate, endDate } = req.query;
    const query = {
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    };

    let data;
    switch (metric) {
      case 'weight':
        data = await Measurement.find(query).select('date weight').sort('date');
        break;
      case 'workouts':
        data = await Workout.find(query).select('date duration type').sort('date');
        break;
      case 'nutrition':
        data = await NutritionEntry.find(query).select('date calories protein carbs fats').sort('date');
        break;
      default:
        return res.status(400).json({ message: 'Invalid metric specified' });
    }

    res.json(data);
  } catch (error) {
    console.error('Progress analysis error:', error);
    res.status(500).json({ message: 'Error analyzing progress' });
  }
});

// Get predictive analytics
router.get('/predictions', auth, async (req, res) => {
  try {
    const { metric, timeframe } = req.query;
    
    // Get historical data
    const data = await Measurement.find({ 
      userId: req.user.id 
    }).sort({ date: -1 }).limit(30);

    // Simple linear regression for prediction
    const prediction = calculateTrendPrediction(data, metric, timeframe);
    
    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Error generating predictions' });
  }
});

function calculateTrendPrediction(data, metric, timeframe) {
  // Simple implementation - can be enhanced with more sophisticated algorithms
  const values = data.map(d => d[metric]);
  const trend = values.reduce((a, b) => a + b, 0) / values.length;
  const lastValue = values[0];
  
  return {
    current: lastValue,
    predicted: lastValue + (trend * 0.1), // Simple projection
    confidence: 0.8,
    timeframe
  };
}

module.exports = router;