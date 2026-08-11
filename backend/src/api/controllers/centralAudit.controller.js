const centralAuditService = require('../../services/centralAudit.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getLogs = catchAsync(async (req, res) => {
  const filters = {
    module: req.query.module,
    action: req.query.action,
    search: req.query.search,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50
  };

  const logs = await centralAuditService.getLogs(req.user, filters);
  res.json({ status: 'success', data: logs });
});

exports.createLog = catchAsync(async (req, res) => {
  // Normally this would be called internally by other services, 
  // but we expose an endpoint for the frontend to log specific UI actions if needed.
  const auditData = {
    userId: req.user.id,
    userName: req.user.fullName,
    role: Array.isArray(req.user.roles) ? req.user.roles.join(', ') : 'Employee',
    department: req.user.departmentName || 'General',
    module: req.body.module,
    action: req.body.action,
    recordIdentifier: req.body.recordIdentifier,
    previousValue: req.body.previousValue,
    newValue: req.body.newValue,
    ipAddress: req.ip
  };

  await centralAuditService.createLog(auditData);
  res.status(201).json({ status: 'success', message: 'Log created successfully' });
});
