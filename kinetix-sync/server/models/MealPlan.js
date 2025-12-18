const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  meals: [{
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
    servings: { type: Number, default: 1 }
  }],
  groceryList: [{
    item: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    checked: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);