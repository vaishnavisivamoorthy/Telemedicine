const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Doctor  = require('../models/Doctor');
const Patient = require('../models/Patient');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const Model = role === 'doctor' ? Doctor : Patient;
    const user  = await Model.create({ name, email, password: hash, role });
    res.status(201).json({ message: 'Registered successfully', id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
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
    res.json({ token, user: { id: user._id, name: user.name, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;