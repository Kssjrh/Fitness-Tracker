const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: Number },
    intensity: { type: String },
    exercises: [{
      name: { type: String, required: true },
      sets: { type: Number, required: true },
      reps: { type: Number, required: true },
      weight: { type: Number }, // in kg
      notes: { type: String }
    }],
    calories: { type: Number },
    completed: { type: Boolean, default: true },
    notes: { type: String },
    isFromRoadmap: { type: Boolean, default: false },
    roadmapDay: { type: String } // e.g., 'Monday', 'Tuesday', etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);


