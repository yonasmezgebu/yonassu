const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const dangerZoneService = require('../../services/dangerZone.service');

const userName = (req) => req.user?.full_name || req.user?.fullName || req.user?.email || 'Unknown';

exports.getOverview = catchAsync(async (req, res) => {
  const overview = await dangerZoneService.getOverview();
  res.json({ status: 'success', data: overview });
});

exports.requestReset = catchAsync(async (req, res) => {
  const { reason, confirmText } = req.body;
  if (String(confirmText || '').trim() !== 'RESET') {
    throw new AppError('Please type RESET to confirm this destructive action', 400);
  }
  if (!reason || String(reason).trim().length < 10) {
    throw new AppError('Please provide a reason of at least 10 characters', 400);
  }
  const request = await dangerZoneService.createRequest({
    requestedBy: req.user.id,
    requestedByName: userName(req),
    reason: String(reason).trim(),
    confirmText: 'RESET',
  });
  await audit('DANGER_ZONE_RESET_REQUESTED', req.user.id, {
    ip: req.ip,
    resourceId: request.id,
    details: { action: 'RESET_ALL_DATA', reason: String(reason).trim() }
  });
  res.status(201).json({
    status: 'success',
    message: 'Reset request submitted. It is now awaiting CEO approval.',
    data: request
  });
});

exports.listRequests = catchAsync(async (req, res) => {
  const { status } = req.query;
  const requests = await dangerZoneService.listRequests({ status });
  res.json({ status: 'success', data: requests });
});

exports.clearTable = catchAsync(async (req, res) => {
  const { table } = req.body;
  const result = await dangerZoneService.clearTableData(table);
  await audit('DANGER_ZONE_TABLE_CLEARED', req.user.id, {
    ip: req.ip,
    resourceId: result.table,
    details: { action: 'CLEAR_TABLE_DATA', table: result.table, rowsDeleted: result.rowsDeleted }
  });
  res.json({
    status: 'success',
    message: `Cleared ${result.rowsDeleted} row(s) from "${result.table}". The table itself was kept.`,
    data: result
  });
});

exports.approveRequest = catchAsync(async (req, res) => {
  const request = await dangerZoneService.approveRequest(req.params.id, {
    approvedBy: req.user.id,
    approvedByName: userName(req),
  });
  await audit('DANGER_ZONE_RESET_EXECUTED', req.user.id, {
    ip: req.ip,
    resourceId: request.id,
    details: {
      action: 'RESET_ALL_DATA',
      tablesCleared: request.completion_summary?.tablesCleared,
      rowsDeleted: request.completion_summary?.rowsDeleted,
    }
  });
  res.json({
    status: 'success',
    message: `Reset approved and executed. ${request.completion_summary?.rowsDeleted || 0} rows removed across ${request.completion_summary?.tablesCleared || 0} tables.`,
    data: request
  });
});

exports.rejectRequest = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason || String(reason).trim().length < 5) {
    throw new AppError('Please provide a rejection reason of at least 5 characters', 400);
  }
  const request = await dangerZoneService.rejectRequest(req.params.id, {
    approvedBy: req.user.id,
    approvedByName: userName(req),
    reason: String(reason).trim(),
  });
  await audit('DANGER_ZONE_RESET_REJECTED', req.user.id, {
    ip: req.ip,
    resourceId: request.id,
    details: { action: 'RESET_ALL_DATA', reason: String(reason).trim() }
  });
  res.json({ status: 'success', message: 'Reset request rejected.', data: request });
});