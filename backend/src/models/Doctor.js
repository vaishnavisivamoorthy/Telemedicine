const mongoose = require('mongoose');
const crypto = require('crypto-js');
const SECRET = process.env.AES_SECRET;

const doctorSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  specialization: { type: String },
  availability:   [{ day: String, startTime: String, endTime: String }],
  role:           { type: String, default: 'doctor' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);