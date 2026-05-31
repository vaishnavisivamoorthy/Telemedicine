const mongoose = require('mongoose');

// Define the AuditLog schema directly here
const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId:    { type: String, default: 'anonymous' },
  ip:        { type: String },
  method:    { type: String },
  path:      { type: String },
  action:    { type: String }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Middleware function
module.exports = (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId:    req.user?.id || 'anonymous',
    ip:        req.ip,
    method:    req.method,
    path:      req.path,
    action:    `${req.method} ${req.path}`
  };

  AuditLog.create(log).catch(err => console.error('Audit log error:', err));
  next(); // always continue, even if logging fails
};