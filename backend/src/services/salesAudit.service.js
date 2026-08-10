const centralAudit = require('./centralAudit.service');

/* ─────────────────────────────────────────────────────────────
   Sales audit helper — mirrors the HR module's pattern.
   Fires a rich central audit log entry (module defaults to
   'Sales', auto-detected for shared controllers like tenders)
   in a non-blocking way, then tells the global audit middleware
   the request was already recorded so it won't write a second
   generic CREATE/UPDATE/DELETE row.
   ───────────────────────────────────────────────────────────── */

// Shared controllers (e.g. tenders) serve both the Sales and
// Procurement dashboards — classify the module by the actor.
const detectModule = (u) => {
  const roleStr = ((Array.isArray(u.roles) ? u.roles.join(',') : '') || u.role_names || u.role || '').toLowerCase();
  const deptStr = ((u.departmentName || u.department_name || '')).toLowerCase();
  if (roleStr.includes('procurement') || deptStr.includes('procurement')) return 'Procurement';
  if (roleStr.includes('finance') || deptStr.includes('finance')) return 'Finance';
  if (roleStr.includes('store')) return 'Store';
  if (roleStr.includes('hr') || deptStr.includes('human resource') || deptStr.includes('hr')) return 'HR';
  return 'Sales';
};

const log = (req, action, recordIdentifier, previousValue, newValue, module) => {
  const u = req.user || {};
  centralAudit.createLog({
    userId:           u.id             || null,
    userName:         u.fullName       || u.full_name || u.username || 'System',
    role:             Array.isArray(u.roles) ? u.roles.join(', ') : (u.role_names || u.role || 'Unknown'),
    department:       u.departmentName || u.department_name || 'Sales',
    module:           module || detectModule(u),
    action,
    recordIdentifier: String(recordIdentifier || ''),
    previousValue,
    newValue,
    ipAddress:        req.ip,
  }).catch(() => {}); // never block
  // Tell the global audit middleware this request was already recorded.
  if (req.res) req.res.locals.__centralAudited = true;
};

module.exports = { log };
