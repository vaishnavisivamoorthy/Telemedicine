const express    = require('express');
const router     = express.Router();
const { z }      = require('zod');
const Patient    = require('../models/Patient');
const authMiddleware = require('../middleware/authMiddleware');

// Zod validation schema
const patientUpdateSchema = z.object({
  phone:   z.string().optional(),
  address: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalHistory: z.string().optional()
});

// GET all patients (doctor/admin only)
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role === 'patient') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const patients = await Patient.find({}, '-password'); // exclude passwords
  res.json(patients);
});

// GET single patient by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id, '-password');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE patient record
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const data = patientUpdateSchema.parse(req.body);
    const patient = await Patient.findByIdAndUpdate(
      req.params.id, data, { new: true, select: '-password' }
    );
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;