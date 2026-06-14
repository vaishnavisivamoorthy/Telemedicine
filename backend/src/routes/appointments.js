const express     = require('express');
const router      = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');

// Collision detection
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

// Get all doctors
router.get('/doctors', authMiddleware, async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    const { specialization } = req.query;
    const filter = specialization ? { specialization } : {};
    const doctors = await Doctor.find(filter, 'name specialization email');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get time slots for a doctor on a date
router.get('/slots/:doctorId', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);

    const booked = await Appointment.find({
      doctorId:  req.params.doctorId,
      status:    { $ne: 'cancelled' },
      startTime: { $gte: start, $lt: end }
    }).select('startTime endTime');

    const slots = [];
    for (let h = 9; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const slotStart = new Date(date);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(h, m + 30, 0, 0);

        const isBooked = booked.some(b => {
          const bs = new Date(b.startTime);
          const be = new Date(b.endTime);
          return slotStart < be && slotEnd > bs;
        });

        slots.push({
          startTime: slotStart.toISOString(),
          endTime:   slotEnd.toISOString(),
          label: `${slotStart.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
          })} — ${slotEnd.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true
          })}`,
          available: !isBooked
        });
      }
    }
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { doctorId, startTime, endTime, timezone } = req.body;
    const start = new Date(startTime);
    const end   = new Date(endTime);

    const available = await isSlotAvailable(doctorId, start, end);
    if (!available) {
      return res.status(409).json({
        error: 'Time slot not available. Please choose another time.'
      });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId, timezone,
      startTime: start,
      endTime:   end
    });

    // Return populated appointment
    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId',  'name specialization');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get appointments with full population
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'patient'
      ? { patientId: req.user.id }
      : { doctorId:  req.user.id };

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone')
      .populate('doctorId',  'name specialization')
      .sort({ startTime: 1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { new: true }
    ).populate('patientId', 'name').populate('doctorId', 'name');
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Confirm
router.patch('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id, { status: 'confirmed' }, { new: true }
    ).populate('patientId', 'name').populate('doctorId', 'name');
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id, { status: 'completed' }, { new: true }
    ).populate('patientId', 'name').populate('doctorId', 'name');
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Public route — no auth needed (for landing page)
router.get('/public-doctors', async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    const { specialization } = req.query;
    const filter = specialization ? { specialization } : {};
    const doctors = await Doctor.find(filter, 'name specialization')
      .limit(10);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;