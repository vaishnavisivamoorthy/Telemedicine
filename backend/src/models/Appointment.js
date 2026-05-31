const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  startTime:   { type: Date, required: true },
  endTime:     { type: Date, required: true },
  status:      { type: String, enum: ['pending','confirmed','cancelled','completed'], default: 'pending' },
  roomToken:   { type: String },   // WebRTC room (Week 3)
  timezone:    { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);