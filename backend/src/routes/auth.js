const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

// Safe model loader
function getModel(role) {
  try { return mongoose.model(role === 'doctor' ? 'Doctor' : 'Patient'); }
  catch { return null; }
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields required' });

    const Model = getModel(role);
    if (!Model)
      return res.status(400).json({ error: 'Invalid role' });

    const existing = await Model.findOne({ email });
    if (existing)
      return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await Model.create({
      name, email, role,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Registered successfully', id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ error: 'All fields required' });

    const Model = getModel(role);
    if (!Model)
      return res.status(400).json({ error: 'Invalid role' });

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;