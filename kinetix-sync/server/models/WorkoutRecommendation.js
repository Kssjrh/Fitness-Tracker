const mongoose = require('mongoose');

const workoutRecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  workoutType: { type: String, enum: ['strength', 'cardio', 'hiit', 'flexibility'] },
  exercises: [{
    name: { type: String, required: true },
    sets: { type: Number },
    reps: { type: String },  // Can be "12" or "8-12" format
    weight: { type: String }, // Can be actual weight or "bodyweight"
    duration: { type: Number }, // in minutes, for cardio exercises
    restTime: { type: Number }, // in seconds
    notes: { type: String }
  }],
  intensity: { type: String, enum: ['low', 'moderate', 'high'] },
  duration: { type: Number }, // Total workout duration in minutes
  calories: { type: Number }, // Estimated calories to be burned
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  userFeedback: {
    difficulty: { type: Number }, // 1-5 scale
    enjoyment: { type: Number }, // 1-5 scale
    effectiveness: { type: Number }, // 1-5 scale
    comments: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutRecommendation', workoutRecommendationSchema);