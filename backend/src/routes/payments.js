const express        = require('express');
const router         = express.Router();
const PDFDoc         = require('pdfkit');
const authMiddleware = require('../middleware/authMiddleware');
const Payment        = require('../models/Payment');
const Appointment    = require('../models/Appointment');

const FEE_MAP = {
  'Cardiologist':     800,
  'Neurologist':      750,
  'Dermatologist':    500,
  'Pediatrician':     450,
  'Orthopedist':      600,
  'Gynecologist':     550,
  'Psychiatrist':     700,
  'General Physician':350,
  'ENT Specialist':   500,
  'default':          400
};

// Create payment after appointment is confirmed
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appt = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');

    if (!appt)
      return res.status(404).json({ error: 'Appointment not found' });

    const existing = await Payment.findOne({ appointmentId });
    if (existing)
      return res.status(400).json({ error: 'Payment already created', payment: existing });

    const spec    = appt.doctorId?.specialization || 'default';
    const amount  = FEE_MAP[spec] || FEE_MAP['default'];
    const dueDate = new Date(appt.startTime);
    dueDate.setDate(dueDate.getDate() - 1);

    // Generate invoice number without pre-save hook
    const count         = await Payment.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;


    const payment = await Payment.create({
      patientId:     appt.patientId._id,
      appointmentId: appt._id,
      doctorId:      appt.doctorId._id,
      amount,
      dueDate,
      invoiceNumber,
      description: `Consultation with Dr. ${appt.doctorId.name} — ${new Date(appt.startTime).toLocaleDateString('en-IN')}`
    });

    const populated = await Payment.findById(payment._id)
      .populate('doctorId',  'name specialization')
      .populate('patientId', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Payment create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get payments for logged-in patient
router.get('/my', authMiddleware, async (req, res) => {
  try {
    await Payment.updateMany({
      patientId: req.user.id,
      status:    'pending',
      dueDate:   { $lt: new Date() }
    }, { status: 'overdue' });

    const payments = await Payment.find({ patientId: req.user.id })
      .populate('doctorId',      'name specialization')
      .populate('appointmentId', 'startTime endTime')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Payment /my error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Process payment (simulate gateway)
router.post('/pay/:id', authMiddleware, async (req, res) => {
  try {
    const { paymentMethod, cardNumber, upiId } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment)
      return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'paid')
      return res.status(400).json({ error: 'Already paid' });

    const transactionId = `TXN${Date.now()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date(), paymentMethod, transactionId },
      { returnDocument: 'after' }
    )
    .populate('doctorId',      'name specialization')
    .populate('patientId',     'name email')
    .populate('appointmentId', 'startTime endTime');

    res.json({ message: 'Payment successful', payment: updated });
  } catch (err) {
    console.error('Payment /pay error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Download payment invoice as PDF
router.get('/invoice/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('doctorId',      'name specialization')
      .populate('patientId',     'name email')
      .populate('appointmentId', 'startTime endTime');

    if (!payment)
      return res.status(404).json({ error: 'Payment not found' });

    const doc = new PDFDoc({ margin:50, size:'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=invoice-${payment.invoiceNumber}.pdf`);
    doc.pipe(res);

    const isPaid = payment.status === 'paid';

    doc.rect(0, 0, 595, 110).fill('#1565c0');
    doc.fill('white').fontSize(26).font('Helvetica-Bold')
       .text('MEDICONNECT', 50, 20);
    doc.fontSize(11).font('Helvetica')
       .text('Telemedicine Platform — Payment Invoice', 50, 55);
    doc.fontSize(10)
       .text(`Invoice: ${payment.invoiceNumber}`, 380, 38)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 380, 54)
       .text(`Status: ${payment.status.toUpperCase()}`, 380, 70);

    const badgeColor = isPaid ? '#4caf50' : payment.status === 'overdue' ? '#f44336' : '#ff9800';
    doc.roundedRect(440, 78, 100, 22, 4).fill(badgeColor);
    doc.fill('white').fontSize(10).font('Helvetica-Bold')
       .text(payment.status.toUpperCase(), 440, 84, { width:100, align:'center' });

    doc.fill('black');

    doc.roundedRect(50, 125, 230, 90, 8).fill('#f0f7ff');
    doc.fill('#1565c0').fontSize(10).font('Helvetica-Bold')
       .text('BILLED TO', 65, 135);
    doc.fill('#333').fontSize(12).font('Helvetica-Bold')
       .text(payment.patientId?.name || 'Patient', 65, 150);
    doc.fill('#666').fontSize(9).font('Helvetica')
       .text(`Email: ${payment.patientId?.email || '—'}`, 65, 168)
       .text(`Patient ID: ${payment.patientId?._id?.toString().slice(-8).toUpperCase()}`, 65, 182)
       .text(`Invoice Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`, 65, 196);

    doc.roundedRect(300, 125, 245, 90, 8).fill('#f0fff4');
    doc.fill('#2e7d32').fontSize(10).font('Helvetica-Bold')
       .text('DOCTOR / SERVICE', 315, 135);
    doc.fill('#333').fontSize(12).font('Helvetica-Bold')
       .text(`Dr. ${payment.doctorId?.name || 'Doctor'}`, 315, 150);
    doc.fill('#666').fontSize(9).font('Helvetica')
       .text(`Specialization: ${payment.doctorId?.specialization || 'General'}`, 315, 168)
       .text(`Appointment: ${payment.appointmentId
         ? new Date(payment.appointmentId.startTime).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })
         : 'N/A'}`, 315, 182)
       .text(`Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-IN')}`, 315, 196);

    doc.rect(50, 232, 495, 32).fill('#1565c0');
    doc.fill('white').fontSize(10).font('Helvetica-Bold')
       .text('DESCRIPTION', 65, 243)
       .text('QTY', 340, 243)
       .text('RATE', 390, 243)
       .text('AMOUNT', 460, 243);

    doc.rect(50, 264, 495, 50).fill('#f9f9f9');
    doc.fill('#333').fontSize(10).font('Helvetica')
       .text(payment.description || 'Medical Consultation', 65, 279, { width:260 })
       .text('1', 340, 279)
       .text(`₹${payment.amount.toFixed(2)}`, 385, 279)
       .text(`₹${payment.amount.toFixed(2)}`, 455, 279);

    const taxAmount   = Math.round(payment.amount * 0.18);
    const totalAmount = payment.amount + taxAmount;

    doc.moveTo(350, 328).lineTo(545, 328).strokeColor('#e0e0e0').lineWidth(1).stroke();
    doc.fill('#555').fontSize(10).font('Helvetica')
       .text('Subtotal:',  370, 338).text(`₹${payment.amount.toFixed(2)}`, 470, 338)
       .text('GST (18%):', 370, 355).text(`₹${taxAmount.toFixed(2)}`,       470, 355);
    doc.rect(350, 370, 195, 30).fill('#1565c0');
    doc.fill('white').fontSize(12).font('Helvetica-Bold')
       .text('TOTAL:', 370, 379).text(`₹${totalAmount.toFixed(2)}`, 460, 379);

    if (isPaid) {
      doc.roundedRect(50, 415, 495, 65, 8).fill('#e8f5e9');
      doc.fill('#2e7d32').fontSize(11).font('Helvetica-Bold')
         .text('✅ PAYMENT CONFIRMED', 65, 425);
      doc.fill('#333').fontSize(10).font('Helvetica')
         .text(`Transaction ID: ${payment.transactionId}`,                       65, 443)
         .text(`Payment Method: ${(payment.paymentMethod || '').toUpperCase()}`, 65, 457)
         .text(`Paid On: ${new Date(payment.paidAt).toLocaleString('en-IN')}`,   300, 443);
    } else {
      doc.roundedRect(50, 415, 495, 65, 8).fill('#fff8e1');
      doc.fill('#f57c00').fontSize(11).font('Helvetica-Bold')
         .text('⚠️ PAYMENT PENDING', 65, 425);
      doc.fill('#333').fontSize(10).font('Helvetica')
         .text(`Amount Due: ₹${totalAmount.toFixed(2)}`, 65, 443)
         .text(`Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-IN')}`, 65, 457)
         .text('Please complete payment before the due date to confirm your appointment.', 300, 443, { width:230 });
    }

    doc.roundedRect(50, 495, 495, 50, 8).fill('#f5f5f5');
    doc.fill('#999').fontSize(9).font('Helvetica')
       .text('Pay via UPI: mediconnect@ybl  |  IFSC: HDFC0001234  |  Account: 9876543210',
             65, 510, { align:'center', width:460 })
       .text('For payment issues contact: billing@mediconnect.in  |  +91 1800-MED-CARE',
             65, 524, { align:'center', width:460 });

    doc.rect(0, 750, 595, 92).fill('#0d47a1');
    doc.fill('white').fontSize(9).font('Helvetica')
       .text('Thank you for choosing MediConnect Telemedicine Platform',
             50, 762, { align:'center', width:495 })
       .text('This is a computer-generated invoice and does not require a physical signature.',
             50, 778, { align:'center', width:495 })
       .text('© 2026 MediConnect. All rights reserved.',
             50, 794, { align:'center', width:495 });

    doc.end();
  } catch (err) {
    console.error('Invoice PDF error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all payments
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });

    await Payment.updateMany(
      { status:'pending', dueDate:{ $lt: new Date() } },
      { status:'overdue' }
    );

    const payments = await Payment.find()
      .populate('patientId',     'name email')
      .populate('doctorId',      'name specialization')
      .populate('appointmentId', 'startTime')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Admin all payments error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: send reminder
router.patch('/admin/remind/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });
    const p = await Payment.findByIdAndUpdate(
      req.params.id,
      { reminderSent: true },
      { returnDocument: 'after' }
    ).populate('patientId', 'name email');
    res.json({ message: `Reminder sent to ${p.patientId?.name}`, payment: p });
  } catch (err) {
    console.error('Remind error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update payment status manually
router.patch('/admin/status/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });
    const p = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { returnDocument: 'after' }
    );
    res.json(p);
  } catch (err) {
    console.error('Status update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: backfill missing payments for confirmed/completed appointments
router.post('/backfill', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Admin only' });

    const appts = await Appointment.find({
      status: { $in: ['confirmed', 'completed'] }
    }).populate('doctorId', 'specialization').populate('patientId', 'name');

    let created = 0, skipped = 0, failed = 0;

    for (const appt of appts) {
      try {
        if (!appt.doctorId || !appt.patientId) { skipped++; continue; }

        const existing = await Payment.findOne({ appointmentId: appt._id });
        if (existing) { skipped++; continue; }

        const spec    = appt.doctorId?.specialization || 'default';
        const amount  = FEE_MAP[spec] || FEE_MAP['default'];
        const dueDate = new Date(appt.startTime);
        dueDate.setDate(dueDate.getDate() - 1);

        await Payment.create({
          patientId:     appt.patientId._id,
          appointmentId: appt._id,
          doctorId:      appt.doctorId._id,
          amount, dueDate, invoiceNumber,
          description: `Consultation — ${new Date(appt.startTime).toLocaleDateString('en-IN')}`
        });
        created++;
      } catch (innerErr) {
        console.error('Backfill row failed:', innerErr.message);
        failed++;
      }
    }

    res.json({ message: `Created: ${created}, Skipped: ${skipped}, Failed: ${failed}` });
  } catch (err) {
    console.error('Backfill error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;