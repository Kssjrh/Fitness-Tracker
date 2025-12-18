const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const WorkoutRecommendation = require('../models/WorkoutRecommendation');
const Workout = require('../models/Workout');

// Get workout recommendation
router.get('/recommend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const previousWorkouts = await Workout.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(5);

    const recommendation = await generateWorkoutRecommendation(user, previousWorkouts);
    res.json(recommendation);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ message: 'Error generating recommendation' });
  }
});

// Submit workout feedback
router.post('/feedback/:recommendationId', auth, async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { difficulty, enjoyment, effectiveness, comments } = req.body;

    const recommendation = await WorkoutRecommendation.findOneAndUpdate(
      { _id: recommendationId, userId: req.user.id },
      {
        userFeedback: { difficulty, enjoyment, effectiveness, comments }
      },
      { new: true }
    );

    // Update user's AI preferences based on feedback
    await updateUserPreferences(req.user.id, recommendation);

    res.json(recommendation);
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

// Get recommendation history
router.get('/history', auth, async (req, res) => {
  try {
    const recommendations = await WorkoutRecommendation.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(10);
    res.json(recommendations);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Error fetching history' });
  }
});

// Helper functions for workout recommendations
async function generateWorkoutRecommendation(user, previousWorkouts) {
  const { fitnessLevel, aiPreferences } = user;
  
  // Define exercise library based on equipment available
  const exercises = getExercisesForEquipment(aiPreferences.equipmentAvailable);
  
  // Determine workout type based on user's history and preferences
  const workoutType = determineWorkoutType(previousWorkouts, aiPreferences.focusAreas);
  
  // Generate exercise selection based on fitness level and preferences
  const selectedExercises = selectExercises(exercises, fitnessLevel, workoutType);
  
  // Create the recommendation
  const recommendation = new WorkoutRecommendation({
    userId: user._id,
    date: new Date(),
    fitnessLevel,
    workoutType,
    exercises: selectedExercises,
    intensity: determineIntensity(fitnessLevel, previousWorkouts),
    duration: determineDuration(user.preferences.workoutDuration),
    calories: estimateCalories(selectedExercises, user)
  });

  await recommendation.save();
  return recommendation;
}

function getExercisesForEquipment(equipment) {
  // Exercise library - can be moved to a database
  const exercises = {
    bodyweight: [
      { name: 'Push-ups', category: 'strength', target: 'chest' },
      { name: 'Squats', category: 'strength', target: 'legs' },
      { name: 'Planks', category: 'core', target: 'core' },
      // Add more exercises
    ],
    dumbbell: [
      { name: 'Dumbbell Press', category: 'strength', target: 'chest' },
      { name: 'Dumbbell Rows', category: 'strength', target: 'back' },
      // Add more exercises
    ],
    // Add more equipment types
  };

  return equipment.reduce((acc, eq) => [...acc, ...exercises[eq] || []], []);
}

function determineWorkoutType(previousWorkouts, focusAreas) {
  // Implement logic to vary workout types and target focus areas
  const lastWorkout = previousWorkouts[0];
  if (!lastWorkout) return 'strength';

  // Alternate between workout types
  const types = ['strength', 'cardio', 'hiit', 'flexibility'];
  const lastIndex = types.indexOf(lastWorkout.type);
  return types[(lastIndex + 1) % types.length];
}

function selectExercises(exercises, fitnessLevel, workoutType) {
  // Filter exercises based on workout type and fitness level
  const filteredExercises = exercises.filter(e => {
    if (workoutType === 'strength') return e.category === 'strength';
    if (workoutType === 'cardio') return e.category === 'cardio';
    return true;
  });

  // Select appropriate number of exercises based on fitness level
  const exerciseCount = {
    beginner: 6,
    intermediate: 8,
    advanced: 10
  }[fitnessLevel];

  // Randomly select exercises
  const selectedExercises = [];
  while (selectedExercises.length < exerciseCount && filteredExercises.length > 0) {
    const index = Math.floor(Math.random() * filteredExercises.length);
    selectedExercises.push({
      ...filteredExercises[index],
      sets: determineSets(fitnessLevel),
      reps: determineReps(fitnessLevel),
      restTime: determineRestTime(fitnessLevel)
    });
    filteredExercises.splice(index, 1);
  }

  return selectedExercises;
}

function determineIntensity(fitnessLevel, previousWorkouts) {
  // Implement progressive overload logic
  const intensityLevels = {
    beginner: ['low', 'low', 'moderate'],
    intermediate: ['low', 'moderate', 'moderate', 'high'],
    advanced: ['moderate', 'high', 'high']
  }[fitnessLevel];

  return intensityLevels[Math.floor(Math.random() * intensityLevels.length)];
}

function determineDuration(preferredDuration) {
  // Adjust duration based on workout type and user preference
  return Math.max(30, Math.min(90, preferredDuration));
}

function estimateCalories(exercises, user) {
  // Implement calorie estimation logic based on exercises and user stats
  const baseCalories = {
    beginner: 200,
    intermediate: 300,
    advanced: 400
  }[user.fitnessLevel];

  return baseCalories * (exercises.length / 6);
}

function determineSets(fitnessLevel) {
  const setRanges = {
    beginner: [2, 3],
    intermediate: [3, 4],
    advanced: [4, 5]
  }[fitnessLevel];

  return setRanges[0] + Math.floor(Math.random() * (setRanges[1] - setRanges[0] + 1));
}

function determineReps(fitnessLevel) {
  const repRanges = {
    beginner: '10-12',
    intermediate: '8-12',
    advanced: '6-12'
  };
  return repRanges[fitnessLevel];
}

function determineRestTime(fitnessLevel) {
  const restTimes = {
    beginner: 90,
    intermediate: 60,
    advanced: 45
  };
  return restTimes[fitnessLevel];
}

async function updateUserPreferences(userId, recommendation) {
  const feedback = recommendation.userFeedback;
  if (!feedback) return;

  const user = await User.findById(userId);

  // Adjust difficulty progression based on feedback
  if (feedback.difficulty > 4) {
    user.aiPreferences.difficultyProgression = 'aggressive';
  } else if (feedback.difficulty < 2) {
    user.aiPreferences.difficultyProgression = 'conservative';
  }

  await user.save();
}

module.exports = router;