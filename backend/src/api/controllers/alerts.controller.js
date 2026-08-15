const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const alertsService = require('../../services/alerts.service');
const { audit } = require('../../config/logger');

exports.getAlerts = catchAsync(async (req, res) => {
  await alertsService.syncAlerts();
  const { status, module } = req.query;
  const data = await alertsService.listAlerts(req.user, { status, module });
  res.json({ status: 'success', data });
});

exports.getUnreadAlertCount = catchAsync(async (req, res) => {
  const unread = await alertsService.getUnreadCount(req.user);
  res.json({ status: 'success', data: { unread } });
});

exports.markAlertRead = catchAsync(async (req, res) => {
  const ok = await alertsService.updateStatus(req.params.id, 'READ', req.user);
  if (!ok) throw new AppError('Alert not found', 404);
  await audit('ALERT_MARKED_READ', req.user.id, { ip: req.ip, details: { alertId: req.params.id } });
  res.json({ status: 'success', message: 'Alert marked as read' });
});

exports.markAlertResolved = catchAsync(async (req, res) => {
  const ok = await alertsService.updateStatus(req.params.id, 'RESOLVED', req.user);
  if (!ok) throw new AppError('Alert not found', 404);
  await audit('ALERT_RESOLVED', req.user.id, { ip: req.ip, details: { alertId: req.params.id } });
  res.json({ status: 'success', message: 'Alert resolved' });
});
