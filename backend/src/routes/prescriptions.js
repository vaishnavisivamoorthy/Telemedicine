const express   = require('express');
const router    = express.Router();
const PDFDoc    = require('pdfkit');
const QRCode    = require('qrcode');
const crypto    = require('crypto');
const authMiddleware  = require('../middleware/authMiddleware');
const Prescription    = require('../models/Prescription');
const Appointment     = require('../models/Appointment');

// Create prescription + return PDF
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { patientId, patientName, medications, notes } = req.body;

    const hash = crypto.createHash('sha256')
      .update(`${patientId}-${Date.now()}-${JSON.stringify(medications)}`)
      .digest('hex');

    const qrDataUrl = await QRCode.toDataURL(
      `http://localhost:5000/api/prescriptions/verify/${hash}`
    );
    const qrBuffer = Buffer.from(
      qrDataUrl.replace('data:image/png;base64,', ''), 'base64'
    );

    // Save to DB
    const prescription = await Prescription.create({
      patientId,
      doctorId:    req.user.id,
      medications, notes,
      verifyHash:  hash
    });

    // Build PDF
    const doc = new PDFDoc({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=prescription-${hash.slice(0,8)}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 595, 100).fill('#1565c0');
    doc.fill('white').fontSize(22).font('Helvetica-Bold')
       .text('TELEMEDICINE CLINIC', 50, 22);
    doc.fontSize(11).font('Helvetica')
       .text('Secure Digital Prescription', 50, 52)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 52);
    doc.fill('black').moveDown(2);

    // Patient info
    doc.roundedRect(50, 112, 495, 60, 8).fill('#e3f2fd');
    doc.fill('#1565c0').fontSize(11).font('Helvetica-Bold')
       .text('PATIENT', 65, 122);
    doc.fill('#333').fontSize(11).font('Helvetica')
       .text(`Name: ${patientName}`, 65, 138)
       .text(`Prescription ID: ${prescription._id}`, 320, 138);

    // Medications
    doc.fill('#1565c0').fontSize(13).font('Helvetica-Bold')
       .text('PRESCRIBED MEDICATIONS', 50, 188);
    doc.moveTo(50, 206).lineTo(545, 206)
       .strokeColor('#1565c0').lineWidth(1.5).stroke();

    let y = 216;
    medications.forEach((med, i) => {
      doc.roundedRect(50, y, 495, 60, 6).fill('#f9f9f9');
      doc.fill('#1565c0').fontSize(12).font('Helvetica-Bold')
         .text(`${i + 1}. ${med.name}`, 65, y + 8);
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(`Dosage: ${med.dosage}`,       65,  y + 26)
         .text(`Frequency: ${med.frequency}`, 220, y + 26)
         .text(`Duration: ${med.duration}`,   390, y + 26);
      y += 68;
    });

    // Notes
    if (notes) {
      doc.fill('#333').fontSize(11).font('Helvetica-Bold')
         .text("DOCTOR'S NOTES:", 50, y + 8);
      doc.roundedRect(50, y + 24, 495, 44, 6).fill('#fffde7');
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(notes, 65, y + 32, { width: 460 });
      y += 78;
    }

    // QR + hash
    doc.image(qrBuffer, 420, y + 8, { width: 100, height: 100 });
    doc.roundedRect(50, y + 8, 350, 54, 6).fill('#f5f5f5');
    doc.fill('#999').fontSize(8).font('Helvetica')
       .text('VERIFICATION HASH', 65, y + 18);
    doc.fill('#555').fontSize(7)
       .text(hash, 65, y + 32, { width: 320 });

    // Footer
    doc.rect(0, 742, 595, 100).fill('#1565c0');
    doc.fill('white').fontSize(8).font('Helvetica')
       .text(
         `Verify at: http://localhost:5000/api/prescriptions/verify/${hash}`,
         50, 756, { width: 495, align: 'center' }
       )
       .text('© Telemedicine Clinic — Confidential Medical Document',
             50, 772, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all prescriptions for a patient
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

// Verify prescription
router.get('/verify/:hash', async (req, res) => {
  try {
    const p = await Prescription.findOne({ verifyHash: req.params.hash })
      .populate('patientId', 'name')
      .populate('doctorId',  'name');
    if (!p) return res.status(404).json({
      valid: false, message: 'Not found or forged'
    });
    res.json({
      valid: true, message: 'Authentic prescription',
      patient: p.patientId?.name, doctor: p.doctorId?.name,
      medications: p.medications, issuedAt: p.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;