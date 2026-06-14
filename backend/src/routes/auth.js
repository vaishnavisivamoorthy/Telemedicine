const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields required' });

    // Choose collection based on role
    const collectionName = role === 'doctor' ? 'doctors' : 'patients';
    const collection = mongoose.connection.collection(collectionName);

    // Check existing
    const existing = await collection.findOne({ email });
    if (existing)
      return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await collection.insertOne({
      name,
      email,
      password:       hashedPassword,
      role,
      specialization: req.body.specialization || null,
      createdAt:      new Date(),
      updatedAt:      new Date()
    });

    res.status(201).json({
      message: 'Registered successfully',
      id:      result.insertedId
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ error: 'All fields required' });

    // Choose collection based on role
    const collectionName = role === 'doctor' ? 'doctors' : 'patients';
    const collection = mongoose.connection.collection(collectionName);

    // For admin, match role field too
    const query = role === 'admin'
      ? { email, role: 'admin' }
      : { email };

    const user = await collection.findOne(query);
    if (!user)
      return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, role: user.role || role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:   user._id,
        name: user.name,
        role: user.role || role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;