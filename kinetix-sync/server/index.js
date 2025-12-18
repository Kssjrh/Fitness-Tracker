require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const analyticsRoutes = require('./routes/analytics');
const mealPlanningRoutes = require('./routes/meal-planning');
const aiRecommendationsRoutes = require('./routes/ai-recommendations');
const bmiRoutes = require('./routes/bmi');
const dataManagementRoutes = require('./routes/data-management');
const notificationRoutes = require('./routes/notifications');
const cronRoutes = require('./routes/cron');

const app = express();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kinetix_sync';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/meal-planning', mealPlanningRoutes);
app.use('/api/ai-recommendations', aiRecommendationsRoutes);
app.use('/api/bmi', bmiRoutes);
app.use('/api/data', dataManagementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cron', cronRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


