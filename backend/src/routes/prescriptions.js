const express   = require('express');
const router    = express.Router();
const PDFDoc    = require('pdfkit');
const QRCode    = require('qrcode');
const crypto    = require('crypto');
const mongoose  = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Prescription   = require('../models/Prescription');

// Helper to find doctor from any collection
async function findDoctor(userId) {
  try {
    const Doctor = require('../models/Doctor');
    const doc = await Doctor.findById(userId);
    if (doc) return doc;
  } catch (e) {}

  // Fallback: check patients collection (in case stored there)
  try {
    const collection = mongoose.connection.collection('doctors');
    const doc = await collection.findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });
    if (doc) return doc;
  } catch (e) {}

  return null;
}

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { patientId, patientName, medications, notes } = req.body;

    // Find doctor name reliably
    const doctor     = await findDoctor(req.user.id);
    const doctorName = doctor?.name || req.user.name || 'Unknown Doctor';
    const doctorSpec = doctor?.specialization || 'General Physician';

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
      patientId,
      doctorId:   req.user.id,
      medications, notes,
      verifyHash: hash
    });

    const doc = new PDFDoc({ margin:50, size:'A4' });
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

    // ── Patient Info (left) + Doctor Info (right) ──
    doc.roundedRect(50, 115, 240, 75, 8).fill('#e3f2fd');
    doc.fill('#1565c0').fontSize(10).font('Helvetica-Bold')
       .text('PATIENT INFORMATION', 65, 124);
    doc.fill('#333').fontSize(12).font('Helvetica-Bold')
       .text(patientName, 65, 140);
    doc.fill('#666').fontSize(9).font('Helvetica')
       .text(`Patient ID: ${patientId?.toString().slice(-8)?.toUpperCase()}`,
             65, 158)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 65, 171);

    doc.roundedRect(305, 115, 240, 75, 8).fill('#e8f5e9');
    doc.fill('#2e7d32').fontSize(10).font('Helvetica-Bold')
       .text('PRESCRIBING DOCTOR', 320, 124);
    doc.fill('#333').fontSize(12).font('Helvetica-Bold')
       .text(`Dr. ${doctorName}`, 320, 140);
    doc.fill('#666').fontSize(9).font('Helvetica')
       .text(`Specialization: ${doctorSpec}`, 320, 158)
       .text(`License: REG-${req.user.id.toString().slice(-6).toUpperCase()}`,
             320, 171);

    // ── Medications ──
    doc.fill('#1565c0').fontSize(13).font('Helvetica-Bold')
       .text('PRESCRIBED MEDICATIONS', 50, 208);
    doc.moveTo(50, 226).lineTo(545, 226)
       .strokeColor('#1565c0').lineWidth(1.5).stroke();

    let y = 236;
    medications.forEach((med, i) => {
      const bg = i % 2 === 0 ? '#f0f7ff' : '#f9f9f9';
      doc.roundedRect(50, y, 495, 65, 6).fill(bg);
      doc.fill('#1565c0').fontSize(12).font('Helvetica-Bold')
         .text(`${i + 1}. ${med.name}`, 65, y + 8);
      doc.fill('#444').fontSize(10).font('Helvetica')
         .text(`Dosage: ${med.dosage}`,       65,  y + 28)
         .text(`Frequency: ${med.frequency}`, 210, y + 28)
         .text(`Duration: ${med.duration}`,   380, y + 28)
         .text('Route: Oral',                 65,  y + 44);
      y += 73;
    });

    // ── Doctor's Notes ──
    if (notes) {
      doc.fill('#333').fontSize(11).font('Helvetica-Bold')
         .text("DOCTOR'S NOTES:", 50, y + 10);
      doc.roundedRect(50, y + 28, 495, 48, 6).fill('#fffde7');
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(notes, 65, y + 38, { width:460, height:30 });
      y += 88;
    }

    // ── QR Code + Hash + Signature ──
    doc.image(qrBuffer, 420, y + 10, { width:110, height:110 });

    doc.roundedRect(50, y + 10, 355, 58, 6).fill('#f5f5f5');
    doc.fill('#aaa').fontSize(8).font('Helvetica')
       .text('VERIFICATION HASH (SHA-256)', 65, y + 20);
    doc.fill('#555').fontSize(7)
       .text(hash, 65, y + 34, { width:325 });

    // Signature line
    const sigY = y + 90;
    doc.moveTo(310, sigY).lineTo(540, sigY)
       .strokeColor('#ccc').lineWidth(0.8).stroke();
    doc.fill('#333').fontSize(10).font('Helvetica-Bold')
       .text(`Dr. ${doctorName}`, 310, sigY + 5, {
         width:230, align:'center'
       });
    doc.fill('#888').fontSize(8).font('Helvetica')
       .text(doctorSpec, 310, sigY + 19, {
         width:230, align:'center'
       })
       .text('Digital Signature', 310, sigY + 31, {
         width:230, align:'center'
       });

    // ── Footer ──
    const footerY = Math.max(sigY + 60, 730);
    doc.rect(0, footerY, 595, 842 - footerY).fill('#1565c0');
    doc.fill('white').fontSize(8).font('Helvetica')
       .text(
         `Verify at: http://localhost:5000/api/prescriptions/verify/${hash}`,
         50, footerY + 12, { width:495, align:'center' }
       )
       .text('This prescription is digitally signed and verified.',
             50, footerY + 26, { align:'center' })
       .text('© Telemedicine Clinic — Confidential Medical Document',
             50, footerY + 40, { align:'center' });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
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
      valid: false, message: 'Not found or may be forged'
    });
    res.json({
      valid:          true,
      message:        'Authentic prescription',
      patient:        p.patientId?.name,
      doctor:         p.doctorId?.name,
      specialization: p.doctorId?.specialization,
      medications:    p.medications,
      notes:          p.notes,
      issuedAt:       p.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download existing prescription as PDF (used by patients) — does NOT regenerate doctor info
router.get('/download/:prescriptionId', authMiddleware, async (req, res) => {
  try {
    const PDFDoc = require('pdfkit');
    const QRCode = require('qrcode');

    const prescription = await Prescription.findById(req.params.prescriptionId)
      .populate('patientId', 'name')
      .populate('doctorId',  'name specialization');

    if (!prescription)
      return res.status(404).json({ error: 'Prescription not found' });

    const hash       = prescription.verifyHash;
    const doctorName = prescription.doctorId?.name || 'Unknown Doctor';
    const doctorSpec = prescription.doctorId?.specialization || 'General Physician';
    const patientName = prescription.patientId?.name || 'Patient';

    const qrDataUrl = await QRCode.toDataURL(
      `http://localhost:5000/api/prescriptions/verify/${hash}`
    );
    const qrBuffer = Buffer.from(
      qrDataUrl.replace('data:image/png;base64,', ''), 'base64'
    );

    const doc = new PDFDoc({ margin:50, size:'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename=prescription-${hash.slice(0,8)}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 595, 100).fill('#1565c0');
    doc.fill('white').fontSize(22).font('Helvetica-Bold')
       .text('TELEMEDICINE CLINIC', 50, 22);
    doc.fontSize(10).font('Helvetica')
       .text('Secure Digital Prescription', 50, 52)
       .text(`Date: ${prescription.createdAt.toLocaleDateString('en-IN')}`, 420, 52)
       .text(`Ref: ${hash.slice(0,8).toUpperCase()}`, 420, 66);
    doc.fill('black');

    doc.roundedRect(50, 115, 240, 75, 8).fill('#e3f2fd');
    doc.fill('#1565c0').fontSize(10).font('Helvetica-Bold')
       .text('PATIENT INFORMATION', 65, 124);
    doc.fill('#333').fontSize(12).font('Helvetica-Bold')
       .text(patientName, 65, 140);
    doc.fill('#666').fontSize(9).font('Helvetica')
       .text(`Patient ID: ${prescription.patientId?._id?.toString().slice(-8)?.toUpperCase()}`, 65, 158)
       .text(`Date: ${prescription.createdAt.toLocaleDateString('en-IN')}`, 65, 171);

    doc.roundedRect(305, 115, 240, 75, 8).fill('#e8f5e9');
    doc.fill('#2e7d32').fontSize(10).font('Helvetica-Bold')
       .text('PRESCRIBING DOCTOR', 320, 124);
    doc.fill('#333').fontSize(12).font('Helvetica-Bold')
       .text(`Dr. ${doctorName}`, 320, 140);
    doc.fill('#666').fontSize(9).font('Helvetica')
       .text(`Specialization: ${doctorSpec}`, 320, 158)
       .text(`License: REG-${prescription.doctorId?._id?.toString().slice(-6)?.toUpperCase()}`, 320, 171);

    doc.fill('#1565c0').fontSize(13).font('Helvetica-Bold')
       .text('PRESCRIBED MEDICATIONS', 50, 208);
    doc.moveTo(50, 226).lineTo(545, 226)
       .strokeColor('#1565c0').lineWidth(1.5).stroke();

    let y = 236;
    prescription.medications.forEach((med, i) => {
      const bg = i % 2 === 0 ? '#f0f7ff' : '#f9f9f9';
      doc.roundedRect(50, y, 495, 65, 6).fill(bg);
      doc.fill('#1565c0').fontSize(12).font('Helvetica-Bold')
         .text(`${i + 1}. ${med.name}`, 65, y + 8);
      doc.fill('#444').fontSize(10).font('Helvetica')
         .text(`Dosage: ${med.dosage}`,       65,  y + 28)
         .text(`Frequency: ${med.frequency}`, 210, y + 28)
         .text(`Duration: ${med.duration}`,   380, y + 28)
         .text('Route: Oral',                 65,  y + 44);
      y += 73;
    });

    if (prescription.notes) {
      doc.fill('#333').fontSize(11).font('Helvetica-Bold')
         .text("DOCTOR'S NOTES:", 50, y + 10);
      doc.roundedRect(50, y + 28, 495, 48, 6).fill('#fffde7');
      doc.fill('#555').fontSize(10).font('Helvetica')
         .text(prescription.notes, 65, y + 38, { width:460, height:30 });
      y += 88;
    }

    doc.image(qrBuffer, 420, y + 10, { width:110, height:110 });
    doc.roundedRect(50, y + 10, 355, 58, 6).fill('#f5f5f5');
    doc.fill('#aaa').fontSize(8).font('Helvetica')
       .text('VERIFICATION HASH (SHA-256)', 65, y + 20);
    doc.fill('#555').fontSize(7)
       .text(hash, 65, y + 34, { width:325 });

    const sigY = y + 90;
    doc.moveTo(310, sigY).lineTo(540, sigY)
       .strokeColor('#ccc').lineWidth(0.8).stroke();
    doc.fill('#333').fontSize(10).font('Helvetica-Bold')
       .text(`Dr. ${doctorName}`, 310, sigY + 5, { width:230, align:'center' });
    doc.fill('#888').fontSize(8).font('Helvetica')
       .text(doctorSpec, 310, sigY + 19, { width:230, align:'center' })
       .text('Digital Signature', 310, sigY + 31, { width:230, align:'center' });

    const footerY = Math.max(sigY + 60, 730);
    doc.rect(0, footerY, 595, 842 - footerY).fill('#1565c0');
    doc.fill('white').fontSize(8).font('Helvetica')
       .text(`Verify at: http://localhost:5000/api/prescriptions/verify/${hash}`,
             50, footerY + 12, { width:495, align:'center' })
       .text('This prescription is digitally signed and verified.',
             50, footerY + 26, { align:'center' })
       .text('© Telemedicine Clinic — Confidential Medical Document',
             50, footerY + 40, { align:'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;