const express  = require('express');
const router   = express.Router();
const PDFDoc   = require('pdfkit');
const QRCode   = require('qrcode');
const crypto   = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const Prescription   = require('../models/Prescription');

// Generate PDF prescription
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      patientName, patientId,
      medications, notes, doctorName
    } = req.body;

    // Create unique verification hash
    const hash = crypto
      .createHash('sha256')
      .update(`${patientId}-${Date.now()}-${JSON.stringify(medications)}`)
      .digest('hex');

    // Generate QR code as base64
    const qrDataUrl = await QRCode.toDataURL(
      `http://localhost:5000/api/prescriptions/verify/${hash}`
    );
    const qrBase64  = qrDataUrl.replace('data:image/png;base64,', '');
    const qrBuffer  = Buffer.from(qrBase64, 'base64');

    // Save to database
    const prescription = await Prescription.create({
      patientId,
      doctorId:    req.user.id,
      medications,
      notes,
      verifyHash:  hash
    });

    // Generate PDF
    const doc = new PDFDoc({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=prescription-${hash.slice(0,8)}.pdf`);
    doc.pipe(res);

    // ── Header ──────────────────────────────────────
    doc.rect(0, 0, 612, 100).fill('#1565c0');
    doc.fill('white')
       .fontSize(24).font('Helvetica-Bold')
       .text('TELEMEDICINE CLINIC', 50, 25);
    doc.fontSize(11).font('Helvetica')
       .text('Secure Digital Prescription', 50, 58);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 58);

    doc.fill('black').moveDown(2);

    // ── Patient Info ─────────────────────────────────
    doc.roundedRect(50, 115, 512, 70, 8)
       .fill('#e3f2fd');
    doc.fill('#1565c0').fontSize(13).font('Helvetica-Bold')
       .text('PATIENT INFORMATION', 65, 125);
    doc.fill('#333').fontSize(11).font('Helvetica')
       .text(`Patient Name : ${patientName}`, 65, 145)
       .text(`Prescription ID : ${prescription._id}`, 320, 145);

    // ── Doctor Info ──────────────────────────────────
    doc.roundedRect(50, 200, 512, 50, 8).fill('#e8f5e9');
    doc.fill('#2e7d32').fontSize(13).font('Helvetica-Bold')
       .text('PRESCRIBING DOCTOR', 65, 210);
    doc.fill('#333').fontSize(11).font('Helvetica')
       .text(`Dr. ${doctorName}`, 65, 228);

    // ── Medications ──────────────────────────────────
    doc.fill('#1565c0').fontSize(14).font('Helvetica-Bold')
       .text('PRESCRIBED MEDICATIONS', 50, 270);
    doc.moveTo(50, 288).lineTo(562, 288)
       .strokeColor('#1565c0').lineWidth(2).stroke();

    let yPos = 300;
    medications.forEach((med, index) => {
      doc.roundedRect(50, yPos, 512, 65, 6).fill('#f9f9f9');
      doc.fill('#1565c0').fontSize(12).font('Helvetica-Bold')
         .text(`${index + 1}. ${med.name}`, 65, yPos + 10);
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(`Dosage: ${med.dosage}`, 65,  yPos + 28)
         .text(`Frequency: ${med.frequency}`, 220, yPos + 28)
         .text(`Duration: ${med.duration}`,   400, yPos + 28);
      yPos += 75;
    });

    // ── Notes ────────────────────────────────────────
    if (notes) {
      doc.fill('#333').fontSize(12).font('Helvetica-Bold')
         .text('DOCTOR\'S NOTES:', 50, yPos + 10);
      doc.roundedRect(50, yPos + 28, 512, 50, 6).fill('#fffde7');
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(notes, 65, yPos + 38, { width: 480 });
      yPos += 90;
    }

    // ── QR Code ──────────────────────────────────────
    doc.image(qrBuffer, 430, yPos + 10, { width: 100, height: 100 });
    doc.fill('#333').fontSize(9).font('Helvetica')
       .text('Scan to verify', 440, yPos + 115)
       .text('authenticity',   448, yPos + 127);

    // ── Verification Hash ────────────────────────────
    doc.roundedRect(50, yPos + 10, 360, 50, 6).fill('#f5f5f5');
    doc.fill('#999').fontSize(8).font('Helvetica')
       .text('VERIFICATION HASH', 65, yPos + 20);
    doc.fill('#555').fontSize(7)
       .text(hash, 65, yPos + 34, { width: 330 });

    // ── Footer ───────────────────────────────────────
    doc.rect(0, 760, 612, 82).fill('#1565c0');
    doc.fill('white').fontSize(9).font('Helvetica')
       .text(
         'This is a digitally generated prescription. Verify at: ' +
         `http://localhost:5000/api/prescriptions/verify/${hash}`,
         50, 772, { width: 512, align: 'center' }
       );
    doc.fontSize(8)
       .text('© Telemedicine Clinic — Confidential Medical Document',
             50, 792, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Verify prescription by hash
router.get('/verify/:hash', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      verifyHash: req.params.hash
    })
    .populate('patientId', 'name email')
    .populate('doctorId',  'name');

    if (!prescription) {
      return res.status(404).json({ valid: false,
        message: 'Prescription not found or may be forged' });
    }

    res.json({
      valid:       true,
      message:     'Prescription is authentic',
      patient:     prescription.patientId?.name,
      doctor:      prescription.doctorId?.name,
      medications: prescription.medications,
      issuedAt:    prescription.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;