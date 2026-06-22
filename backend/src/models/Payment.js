const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  amount:        { type: Number, required: true },
  currency:      { type: String, default: 'INR' },
  status:        { type: String,
                   enum: ['pending', 'paid', 'overdue', 'cancelled'],
                   default: 'pending' },
  dueDate:       { type: Date, required: true },
  paidAt:        { type: Date },
  paymentMethod: { type: String, default: null },
  transactionId: { type: String },
  description:   { type: String },
  invoiceNumber: { type: String },
  reminderSent:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);