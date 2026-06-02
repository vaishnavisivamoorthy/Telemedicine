const express     = require('express');
const router      = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');

// Collision detection function
async function isSlotAvailable(doctorId, startTime, endTime, excludeId = null) {
  const query = {
    doctorId,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: endTime,   $gte: startTime } },
      { endTime:   { $gt: startTime, $lte: endTime   } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  const conflict = await Appointment.findOne(query);
  return !conflict;
}

// Book appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { doctorId, startTime, endTime, timezone } = req.body;
    const start = new Date(startTime);
    const end   = new Date(endTime);

    const available = await isSlotAvailable(doctorId, start, end);
    if (!available) {
      return res.status(409).json({ error: 'Time slot not available. Please choose another time.' });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      startTime: start,
      endTime:   end,
      timezone
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get appointments (patient sees own, doctor sees theirs)
router.get('/', authMiddleware, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patientId: req.user.id }
    : { doctorId:  req.user.id };

  const appointments = await Appointment.find(filter)
    .populate('patientId', 'name email')
    .populate('doctorId',  'name specialization')
    .sort({ startTime: 1 });

  res.json(appointments);
});

// Cancel appointment
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Confirm appointment (doctor only)
router.patch('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id, { status: 'confirmed' }, { new: true }
    );
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete appointment (doctor only)
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id, { status: 'completed' }, { new: true }
    );
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;