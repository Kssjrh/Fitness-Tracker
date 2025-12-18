const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  weight: { type: Number },
  bodyFat: { type: Number },
  chest: { type: Number },
  waist: { type: Number },
  hips: { type: Number },
  arms: { type: Number },
  thighs: { type: Number },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Measurement', measurementSchema);