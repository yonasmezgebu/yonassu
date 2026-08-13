const centralAudit = require('./centralAudit.service');

const MODULE = 'Car Rental';

/* ─────────────────────────────────────────────────────────────
   Helper: fire a central audit log entry in a non-blocking way
   for Car Rental / Agri Rental dashboard activity.
   Mirrors the HR pattern (hr.controller.js `log()`):
   - rich action name + before/after snapshots
   - department = the actor's department so the Car Rental
     manager sees the records on the Central Audit Log page
   - sets __centralAudited so the global middleware does not
     write a second generic CREATE/UPDATE/DELETE row.
   Failures are swallowed so audit never breaks a request.
   ───────────────────────────────────────────────────────────── */
const log = (req, action, recordIdentifier, previousValue, newValue) => {
  const u = req.user || {};
  centralAudit.createLog({
    userId:           u.id             || null,
    userName:         u.fullName       || u.full_name || u.username || 'System',
    role:             Array.isArray(u.roles) ? u.roles.join(', ') : (u.role_names || u.role || 'Unknown'),
    department:       u.departmentName || u.department_name || MODULE,
    module:           MODULE,
    action,
    recordIdentifier: String(recordIdentifier || ''),
    previousValue,
    newValue,
    ipAddress:        req.ip,
  }).catch(() => {}); // never block
  if (req.res) req.res.locals.__centralAudited = true;
};

module.exports = { log, MODULE };
