const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const getSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  age: user.age,
  gender: user.gender,
  height: user.height,
  weight: user.weight,
  goals: user.goals || [],
  joinDate: user.joinDate,
  calorieGoal: user.bmiData?.calorieGoal || user.calorieGoal,
  proteinGoal: user.bmiData?.proteinGoal,
  activityLevel: user.activityLevel,
  bmiData: user.bmiData
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, gender, height, weight, goals, activityLevel } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      passwordHash, 
      age, 
      gender, 
      height, 
      weight, 
      goals,
      activityLevel
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ token, user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { height, weight, age, gender, goals, activityLevel, calorieGoal } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update only provided fields
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (goals !== undefined) user.goals = goals;
    if (activityLevel !== undefined) user.activityLevel = activityLevel;
    if (calorieGoal !== undefined) user.calorieGoal = calorieGoal;

    await user.save();
    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;