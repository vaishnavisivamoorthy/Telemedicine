const mongoose = require('mongoose');
const crypto = require('crypto-js');
const SECRET = process.env.AES_SECRET;

const medicalRecordSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  diagnosis:   { type: String },   // will be encrypted
  vitals:      { type: String },   // will be encrypted
  notes:       { type: String },
  attachments: [{ filename: String, url: String }]
}, { timestamps: true });

// Encrypt sensitive fields before saving
medicalRecordSchema.pre('save', function(next) {
  if (this.isModified('diagnosis')) {
    this.diagnosis = crypto.AES.encrypt(this.diagnosis, SECRET).toString();
  }
  if (this.isModified('vitals')) {
    this.vitals = crypto.AES.encrypt(this.vitals, SECRET).toString();
  }
  next();
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);