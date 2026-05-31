const mongoose = require('mongoose');
const crypto = require('crypto-js');
const SECRET = process.env.AES_SECRET;

const patientSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  dob:            { type: Date },
  phone:          { type: String },
  address:        { type: String },
  allergies:      [{ type: String }],
  medicalHistory: { type: String },
  role:           { type: String, default: 'patient' }
}, { timestamps: true });

// Encrypt sensitive fields before saving
patientSchema.pre('save', function(next) {
  if (this.isModified('medicalHistory') && this.medicalHistory) {
    this.medicalHistory = crypto.AES.encrypt(
      JSON.stringify(this.medicalHistory), SECRET
    ).toString();
  }
  next();
});

// Decrypt when reading
patientSchema.methods.getDecryptedHistory = function() {
  if (!this.medicalHistory) return null;
  const bytes = crypto.AES.decrypt(this.medicalHistory, SECRET);
  return JSON.parse(bytes.toString(crypto.enc.Utf8));
};

module.exports = mongoose.model('Patient', patientSchema);