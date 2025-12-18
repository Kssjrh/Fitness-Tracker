const mongoose = require('mongoose');

const nutritionEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD for easy querying
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snacks'], required: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fats: { type: Number, default: 0, min: 0 },
    servingSize: { type: Number, required: true, min: 0 },
    servingUnit: { type: String, required: true },
    isRoadmapMeal: { type: Boolean, default: false }, // Indicates if this meal is from the roadmap
    adheresToRoadmap: { type: Boolean, default: false }, // Indicates if this meal adheres to the roadmap goals
    notes: { type: String },
    mealGoals: { // Goals from the roadmap for this meal type
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fats: { type: Number, min: 0 }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

nutritionEntrySchema.index({ userId: 1, date: 1 });

// Virtual for calculating percentage of goal met
nutritionEntrySchema.virtual('goalCompletion').get(function() {
  if (!this.mealGoals.calories) return null;
  
  return {
    calories: (this.calories / this.mealGoals.calories) * 100,
    protein: (this.protein / this.mealGoals.protein) * 100,
    carbs: (this.carbs / this.mealGoals.carbs) * 100,
    fats: (this.fats / this.mealGoals.fats) * 100
  };
});

// Method to check if entry meets roadmap goals
nutritionEntrySchema.methods.checkRoadmapAdherence = function() {
  if (!this.mealGoals.calories) return false;

  const TOLERANCE = 0.15; // 15% tolerance for macro goals
  const withinRange = (actual, target) => {
    return actual >= target * (1 - TOLERANCE) && actual <= target * (1 + TOLERANCE);
  };

  return withinRange(this.calories, this.mealGoals.calories) &&
         withinRange(this.protein, this.mealGoals.protein) &&
         withinRange(this.carbs, this.mealGoals.carbs) &&
         withinRange(this.fats, this.mealGoals.fats);
};

module.exports = mongoose.model('NutritionEntry', nutritionEntrySchema);