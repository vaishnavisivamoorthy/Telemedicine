const mongoose = require('mongoose');
const cryptoJs = require('crypto-js');

let Patient;

try {
  Patient = mongoose.model('Patient');
} catch {
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

  patientSchema.pre('save', function(next) {
    try {
      const SECRET = process.env.AES_SECRET;
      if (this.isModified('medicalHistory') && this.medicalHistory) {
        this.medicalHistory = cryptoJs.AES.encrypt(
          this.medicalHistory, SECRET
        ).toString();
      }
      next();
    } catch(err) {
      next(err);
    }
  });

  patientSchema.methods.getDecryptedHistory = function() {
    const SECRET = process.env.AES_SECRET;
    if (!this.medicalHistory) return null;
    const bytes = cryptoJs.AES.decrypt(this.medicalHistory, SECRET);
    return bytes.toString(cryptoJs.enc.Utf8);
  };

  Patient = mongoose.model('Patient', patientSchema);
}

module.exports = Patient;