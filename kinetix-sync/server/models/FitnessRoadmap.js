const mongoose = require('mongoose');

const fitnessRoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roadmap: {
    dailyCalories: Number,
    weeklyPlan: {
      type: Map,
      of: {
        meals: {
          breakfast: [String],
          lunch: [String],
          dinner: [String],
          snacks: [String]
        },
        workout: {
          type: String,
          exercises: [{
            name: String,
            sets: Number,
            reps: Number,
            duration: Number,
            notes: String
          }]
        }
      }
    },
    adaptiveGoals: {
      calories: {
        min: Number,
        target: Number,
        max: Number
      },
      protein: Number,
      carbs: Number,
      fats: Number,
      workoutsPerWeek: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('FitnessRoadmap', fitnessRoadmapSchema);