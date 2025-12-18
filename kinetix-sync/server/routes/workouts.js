const express = require('express');
const mongoose = require('mongoose');
const Workout = require('../models/Workout');
const FitnessRoadmap = require('../models/FitnessRoadmap');
const auth = require('../middleware/auth');
const { updateStreak } = require('../middleware/streak');

const router = express.Router();

// Save or update fitness roadmap
router.post('/roadmap', auth, async (req, res) => {
  try {
    const { roadmap } = req.body;
    let existingRoadmap = await FitnessRoadmap.findOne({ userId: req.user.id });

    if (existingRoadmap) {
      existingRoadmap.roadmap = roadmap;
      await existingRoadmap.save();
    } else {
      existingRoadmap = await FitnessRoadmap.create({
        userId: req.user.id,
        roadmap
      });
    }

    res.status(201).json({ roadmap: existingRoadmap.roadmap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's fitness roadmap
router.get('/roadmap', auth, async (req, res) => {
  try {
    const roadmap = await FitnessRoadmap.findOne({ userId: req.user.id });
    res.json({ roadmap: roadmap?.roadmap || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Log a workout
router.post('/log', auth, updateStreak, async (req, res) => {
  try {
    const { type, exercises, duration, calories, notes } = req.body;
    
    const payload = {
      userId: req.user.id,
      type,
      exercises,
      duration,
      calories,
      notes,
      date: new Date()
    };

    const workout = await Workout.create(payload);

    // Update user's stats
    const user = await mongoose.model('User').findById(req.user.id);
    user.totalWorkouts = (user.totalWorkouts || 0) + 1;
    user.lastWorkout = new Date();
    await user.save();

    res.status(201).json(workout);
  } catch (err) {
    console.error('Error logging workout:', err);
    res.status(500).json({ message: err.message || 'Failed to log workout' });
  }
});

// Get workout history
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const workouts = await Workout.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(100); // Limit to last 100 workouts

    res.json(workouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a workout
router.put('/:workoutId', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.workoutId,
      userId: req.user.id
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    // Calculate new duration and calories
    let totalDuration = 0;
    let totalCalories = 0;
    
    req.body.exercises.forEach(exercise => {
      const intensityMultiplier = {
        low: 5,
        moderate: 8,
        high: 12
      }[exercise.intensity || 'moderate'];

      if (exercise.type === 'duration') {
        totalDuration += exercise.duration;
        totalCalories += exercise.duration * intensityMultiplier;
      } else {
        totalDuration += exercise.sets * exercise.reps * 3;
        totalCalories += exercise.sets * exercise.reps * (exercise.weight || 1) * 0.1;
      }
    });

    workout.type = req.body.type;
    workout.exercises = req.body.exercises;
    workout.duration = totalDuration;
    workout.calories = Math.round(totalCalories);
    workout.notes = req.body.notes;

    await workout.save();
    res.json(workout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a workout
router.delete('/:workoutId', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.workoutId,
      userId: req.user.id
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    await workout.remove();
    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily progress
router.get('/daily-progress', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const workouts = await Workout.find({
      userId: req.user.id,
      date: today
    });

    const progress = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      workoutsCompleted: workouts.length
    };

    // TODO: Add nutrition entries when integrating with nutrition tracking

    res.json({ progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update daily progress (mainly for nutrition tracking)
router.post('/daily-progress', auth, async (req, res) => {
  try {
    const { calories, protein, carbs, fats } = req.body;
    // TODO: Create or update nutrition entry for the day
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark roadmap workout as completed
router.post('/complete-roadmap-workout', auth, async (req, res) => {
  try {
    const { day, workout } = req.body;
    const payload = {
      userId: req.user.id,
      date: new Date().toISOString().split('T')[0],
      type: workout.type,
      exercises: workout.exercises,
      isFromRoadmap: true,
      roadmapDay: day,
      completed: true
    };

    const completedWorkout = await Workout.create(payload);
    res.status(201).json(completedWorkout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


