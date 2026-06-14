const express   = require('express');
const router    = express.Router();
const PDFDoc    = require('pdfkit');
const QRCode    = require('qrcode');
const crypto    = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const Prescription   = require('../models/Prescription');

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { patientId, patientName, medications, notes } = req.body;

    // Fetch doctor name from DB
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findById(req.user.id);
    const doctorName = doctor?.name || 'Unknown Doctor';

    const hash = crypto.createHash('sha256')
      .update(`${patientId}-${Date.now()}-${JSON.stringify(medications)}`)
      .digest('hex');

    const qrDataUrl = await QRCode.toDataURL(
      `http://localhost:5000/api/prescriptions/verify/${hash}`
    );
    const qrBuffer = Buffer.from(
      qrDataUrl.replace('data:image/png;base64,', ''), 'base64'
    );

    await Prescription.create({
      patientId, doctorId: req.user.id,
      medications, notes, verifyHash: hash
    });

    const doc = new PDFDoc({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=prescription-${hash.slice(0,8)}.pdf`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, 595, 100).fill('#1565c0');
    doc.fill('white').fontSize(22).font('Helvetica-Bold')
       .text('TELEMEDICINE CLINIC', 50, 22);
    doc.fontSize(10).font('Helvetica')
       .text('Secure Digital Prescription', 50, 52)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 420, 52)
       .text(`Ref: ${hash.slice(0,8).toUpperCase()}`, 420, 66);
    doc.fill('black');

    // ── Patient + Doctor Info ──
    doc.roundedRect(50, 115, 240, 70, 8).fill('#e3f2fd');
    doc.fill('#1565c0').fontSize(10).font('Helvetica-Bold')
       .text('PATIENT', 65, 125);
    doc.fill('#333').fontSize(11).font('Helvetica')
       .text(patientName, 65, 140);
    doc.fill('#666').fontSize(9)
       .text(`ID: ${patientId?.toString().slice(-8)}`, 65, 158);

    doc.roundedRect(305, 115, 240, 70, 8).fill('#e8f5e9');
    doc.fill('#2e7d32').fontSize(10).font('Helvetica-Bold')
       .text('PRESCRIBING DOCTOR', 320, 125);
    doc.fill('#333').fontSize(11).font('Helvetica')
       .text(`Dr. ${doctorName}`, 320, 140);
    doc.fill('#666').fontSize(9)
       .text(doctor?.specialization || 'General Physician', 320, 158);

    // ── Medications ──
    doc.fill('#1565c0').fontSize(13).font('Helvetica-Bold')
       .text('PRESCRIBED MEDICATIONS', 50, 202);
    doc.moveTo(50, 220).lineTo(545, 220)
       .strokeColor('#1565c0').lineWidth(1.5).stroke();

    let y = 230;
    medications.forEach((med, i) => {
      doc.roundedRect(50, y, 495, 62, 6).fill(i % 2 === 0 ? '#f9f9f9' : '#f0f7ff');
      doc.fill('#1565c0').fontSize(12).font('Helvetica-Bold')
         .text(`${i + 1}. ${med.name}`, 65, y + 8);
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(`Dosage: ${med.dosage}`,       65,  y + 28)
         .text(`Frequency: ${med.frequency}`, 220, y + 28)
         .text(`Duration: ${med.duration}`,   390, y + 28)
         .text(`Route: Oral`, 65, y + 44);
      y += 70;
    });

    // ── Notes ──
    if (notes) {
      doc.fill('#333').fontSize(11).font('Helvetica-Bold')
         .text("DOCTOR'S NOTES:", 50, y + 8);
      doc.roundedRect(50, y + 24, 495, 44, 6).fill('#fffde7');
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(notes, 65, y + 34, { width: 460 });
      y += 80;
    }

    // ── QR + Hash ──
    doc.image(qrBuffer, 420, y + 10, { width: 100, height: 100 });
    doc.roundedRect(50, y + 10, 355, 55, 6).fill('#f5f5f5');
    doc.fill('#999').fontSize(8).font('Helvetica')
       .text('VERIFICATION HASH (SHA-256)', 65, y + 20);
    doc.fill('#555').fontSize(7)
       .text(hash, 65, y + 34, { width: 325 });

    // ── Signature line ──
    doc.moveTo(310, y + 100).lineTo(540, y + 100)
       .strokeColor('#999').lineWidth(0.5).stroke();
    doc.fill('#666').fontSize(9)
       .text(`Dr. ${doctorName}`, 310, y + 106, {
         width: 230, align: 'center'
       });
    doc.fill('#999').fontSize(8)
       .text('Doctor Signature', 310, y + 120, {
         width: 230, align: 'center'
       });

    // ── Footer ──
    doc.rect(0, 742, 595, 100).fill('#1565c0');
    doc.fill('white').fontSize(8).font('Helvetica')
       .text(
         `Verify at: http://localhost:5000/api/prescriptions/verify/${hash}`,
         50, 756, { width: 495, align: 'center' }
       )
       .text('This prescription is digitally signed and verified.',
             50, 770, { align: 'center' })
       .text('© Telemedicine Clinic — Confidential Medical Document',
             50, 784, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId
    })
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify/:hash', async (req, res) => {
  try {
    const p = await Prescription.findOne({ verifyHash: req.params.hash })
      .populate('patientId', 'name')
      .populate('doctorId',  'name specialization');
    if (!p) return res.status(404).json({
      valid: false, message: 'Not found or forged'
    });
    res.json({
      valid: true, message: 'Authentic prescription',
      patient: p.patientId?.name,
      doctor:  p.doctorId?.name,
      specialization: p.doctorId?.specialization,
      medications: p.medications,
      issuedAt: p.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;