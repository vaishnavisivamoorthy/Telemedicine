const auditLogMiddleware = (req, res, next) => {
  console.log(`[AUDIT] ${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
};

module.exports = auditLogMiddleware;