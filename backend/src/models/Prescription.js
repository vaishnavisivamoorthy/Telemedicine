const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  medications:  [{ name: String, dosage: String, frequency: String, duration: String }],
  notes:        { type: String },
  pdfUrl:       { type: String },   // stored PDF path
  verifyHash:   { type: String },   // SHA-256 hash for QR verification
  qrCode:       { type: String }    // base64 QR image
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);