const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  ingredients: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  nutritionInfo: {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fats: { type: Number },
    fiber: { type: Number }
  },
  instructions: [{ type: String }],
  prepTime: { type: Number },  // in minutes
  cookTime: { type: Number },  // in minutes
  servings: { type: Number },
  tags: [{ type: String }],
  imageUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);