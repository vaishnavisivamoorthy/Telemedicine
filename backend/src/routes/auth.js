const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const Doctor   = require('../models/Doctor');

// Inline simple Patient model (bypasses pre-save hook conflict)
let Patient;
try {
  Patient = mongoose.model('Patient');
} catch {
  const s = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, default: 'patient' },
    phone:    { type: String },
    address:  { type: String },
    allergies:[{ type: String }],
    medicalHistory: { type: String }
  }, { timestamps: true });
  Patient = mongoose.model('Patient', s);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const Model = role === 'doctor' ? Doctor : Patient;

    const existing = await Model.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Use insertOne directly — bypasses pre-save hook completely
    const result = await Model.collection.insertOne({
      name,
      email,
      password:  hashedPassword,
      role:      role || 'patient',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: 'Registered successfully',
      id:      result.insertedId
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const Model = role === 'doctor' ? Doctor : Patient;
    const user  = await Model.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;