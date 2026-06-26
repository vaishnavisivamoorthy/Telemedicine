const express        = require('express');
const router         = express.Router();
const Appointment    = require('../models/Appointment');
const Doctor         = require('../models/Doctor');
const Patient        = require('../models/Patient');
const authMiddleware = require('../middleware/authMiddleware');

// ── Collision detection helper ──────────────────────────────
async function isSlotAvailable(doctorId, startTime, endTime, excludeId = null) {
  const query = {
    doctorId,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: endTime,    $gte: startTime } },
      { endTime:   { $gt: startTime,  $lte: endTime   } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  const conflict = await Appointment.findOne(query);
  return !conflict;
}

// ── PUBLIC: Doctors for landing page (no auth, no admins) ───
// MUST be before /:id routes
router.get('/public-doctors', async (req, res) => {
  try {
    const { specialization } = req.query;
    const filter = {
      role: { $ne: 'admin' },
      ...(specialization ? { specialization } : {})
    };
    const doctors = await Doctor.find(filter, 'name specialization').limit(10);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Authenticated doctors list (excludes admins) ─────────────
// MUST be before /:id routes
router.get('/doctors', authMiddleware, async (req, res) => {
  try {
    const { specialization } = req.query;
    const filter = {
      role: { $ne: 'admin' },
      ...(specialization ? { specialization } : {})
    };
    const doctors = await Doctor.find(filter, 'name specialization email');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Time slots for a doctor on a date ───────────────────────
// MUST be before /:id routes
router.get('/slots/:doctorId', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

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

// ── Book appointment ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { doctorId, startTime, endTime, timezone } = req.body;

    if (!doctorId || !startTime || !endTime)
      return res.status(400).json({ error: 'doctorId, startTime and endTime are required' });

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
      doctorId,
      timezone,
      startTime: start,
      endTime:   end
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId',  'name specialization');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Get all appointments for logged-in user ──────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'patient') {
      filter = { patientId: req.user.id };
    } else if (req.user.role === 'doctor') {
      filter = { doctorId: req.user.id };
    }
    // admin sees all

    const appointments = await Appointment.find(filter)
      .populate({
        path:  'patientId',
        match: { role: { $ne: 'admin' } },
        select: 'name email phone'
      })
      .populate('doctorId', 'name specialization')
      .sort({ startTime: 1 });

    // Filter out appointments where patientId is null (admin-created or filtered out)
    res.json(appointments.filter(a => a.patientId !== null));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cancel appointment ───────────────────────────────────────
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { returnDocument: 'after' }
    )
    .populate('patientId', 'name')
    .populate('doctorId',  'name');

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Confirm appointment ──────────────────────────────────────
router.patch('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed' },
      { returnDocument: 'after' }
    )
    .populate('patientId', 'name')
    .populate('doctorId',  'name');

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Complete appointment ─────────────────────────────────────
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { returnDocument: 'after' }
    )
    .populate('patientId', 'name')
    .populate('doctorId',  'name');

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;