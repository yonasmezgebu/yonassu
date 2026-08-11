const centralAudit = require('../services/centralAudit.service');

/**
 * Helper: fire a central audit log entry in a non-blocking way for the Pharmacy module.
 * Failures are swallowed so audit never breaks a real request.
 * 
 * @param {Object} req - The Express request object
 * @param {string} action - The action performed (e.g. 'Sale Created', 'Transfer Approved')
 * @param {string} recordIdentifier - An identifier for the record (e.g. 'Sale #ORD-123')
 * @param {Object} previousValue - The JSON snapshot of the state BEFORE the action
 * @param {string} moduleName - The module name ('Pharmacy', 'Pharmacy Store', 'Pharmacy Sales')
 */
const logPharmacyAction = (req, action, recordIdentifier, previousValue, newValue, moduleName = 'Pharmacy') => {
  const u = req.user || {};
  centralAudit.createLog({
    userId:           u.id             || null,
    userName:         u.fullName       || u.full_name || u.username || 'System',
    role:             Array.isArray(u.roles) ? u.roles.join(', ') : (u.role_names || u.role || 'Unknown'),
    department:       u.departmentName || u.department_name || 'Pharmacy',
    module:           moduleName,
    action,
    recordIdentifier: String(recordIdentifier || ''),
    previousValue,
    newValue,
    ipAddress:        req.ip,
  }).catch(err => {
    console.error('Pharmacy Audit Log Error:', err);
  }); // never block
  
  // Tell the global audit middleware this request was already recorded,
  // so it won't write a second generic CREATE/UPDATE/DELETE row.
  if (req.res) req.res.locals.__centralAudited = true;
};

module.exports = logPharmacyAction;
