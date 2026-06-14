const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access only' });
  next();
};

// Get all doctors
router.get('/doctors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    const doctors = await Doctor.find({}, '-password').sort({ name: 1 });
    res.json(doctors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all patients
router.get('/patients', authMiddleware, adminOnly, async (req, res) => {
  try {
    const Patient = require('../models/Patient');
    const patients = await Patient.find({}, '-password').sort({ name: 1 });
    res.json(patients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add doctor
router.post('/add-doctor', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;
    const Doctor = require('../models/Doctor');

    const existing = await Doctor.findOne({ email });
    if (existing)
      return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const doctor = await Doctor.create({
      name, email, specialization,
      password: hashed, role: 'doctor'
    });
    res.status(201).json({
      message: 'Doctor added', id: doctor._id
    });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete doctor
router.delete('/doctors/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;