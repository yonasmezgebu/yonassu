const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { logAudit } = require('../../services/audit.service');
const { sendFinanceNotification, sendCeoNotification, sendPurchaseNotification } = require('../../services/notification.service');

exports.createRequest = catchAsync(async (req, res) => {
  const { module, item_name, item_description, quantity, estimated_cost, urgency, justification, requester_signature } = req.body;
  const request_code = `PRQ-${Date.now()}`;
  
  await db('general_procurement_requests').insert({
    request_code, module, item_name, item_description, quantity, 
    estimated_cost: estimated_cost === '' ? null : estimated_cost, 
    urgency, justification, requester_signature,
    requested_by: req.user ? req.user.id : 1,
    status: 'PENDING'
  });
  
  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: `CREATE_GENERAL_PROCUREMENT`,
    resource: 'General Procurement',
    resourceId: request_code,
    beforeState: null,
    afterState: { request_code, module, item_name, quantity, urgency, status: 'PENDING' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.status(201).json({ status: 'success', message: 'Procurement request submitted.' });
});

exports.getPending = catchAsync(async (req, res) => {
  const requests = await db('general_procurement_requests')
    .whereIn('status', ['PENDING', 'WAIT'])
    .orderBy('created_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.decideRequest = catchAsync(async (req, res) => {
  const { decision, reason, document_url } = req.body; 
  // decision: APPROVE, REJECT, WAIT
  const statusMap = { 'APPROVE': 'APPROVED', 'REJECT': 'REJECTED', 'WAIT': 'WAIT' };
  const newStatus = statusMap[decision];
  if (!newStatus) throw AppError.badRequest('Invalid decision');
  
  const oldRequest = await db('general_procurement_requests').where('id', req.params.id).first();

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: newStatus,
    ceo_decision_reason: reason || null,
    ceo_document_url: document_url || null,
    decided_by: req.user ? req.user.id : 1,
    decided_at: db.fn.now()
  });
  
  const newRequest = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: `CEO_${decision}_GENERAL_PROCUREMENT`,
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: oldRequest,
    afterState: newRequest,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await sendCeoNotification({
    title: decision === 'APPROVE' ? 'Procurement Request Approved' : (decision === 'REJECT' ? 'Procurement Request Rejected' : 'Procurement Request - Wait'),
    message: `Request ${newRequest.request_code} (${newRequest.item_name}) ${decision === 'APPROVE' ? 'approved' : decision === 'REJECT' ? 'rejected' : 'placed on hold'}${reason ? ' - ' + reason : ''}.`,
    type: 'general',
    link: '/finance/general-procurement?tab=pending-payment',
    related_entity_id: newRequest.id
  }, req.app?.get('io')).catch(e => console.error('Failed to notify CEO:', e.message));

  // Purchase office acts on approved requests; rejected ones close out
  if (decision !== 'WAIT') {
    sendPurchaseNotification({
      title: decision === 'APPROVE'
        ? `📋 Request ${newRequest.request_code} Approved — Process It`
        : `❌ Request ${newRequest.request_code} Rejected`,
      message: `${newRequest.item_name}${reason ? ' — Reason: ' + reason : ''}`,
      type: decision === 'APPROVE' ? 'success' : 'error',
      link: '/purchase/general-requests',
      related_entity_id: newRequest.id
    }, req.app?.get('io')).catch(() => {});
  }

  res.json({ status: 'success', message: `Request ${newStatus}` });
});

exports.getApproved = catchAsync(async (req, res) => {
  const requests = await db('general_procurement_requests')
    .whereIn('status', ['APPROVED', 'ACCEPTED', 'PAYMENT_REQUESTED', 'FINANCE_CHECKED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PAID', 'COMPLETED'])
    .orderBy('decided_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.acceptRequest = catchAsync(async (req, res) => {
  const old = await db('general_procurement_requests').where('id', req.params.id).first();
  if (!old) throw AppError.notFound('Request not found');

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: 'ACCEPTED',
    accepted_by: req.user ? req.user.id : 1,
    accepted_at: db.fn.now()
  });

  const updated = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: 'PURCHASE_ACCEPT_GENERAL_PROCUREMENT',
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: old,
    afterState: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.json({ status: 'success', message: 'Request accepted by Purchase.' });
});

exports.requestPayment = catchAsync(async (req, res) => {
  const { requested_amount } = req.body;
  if (!requested_amount) throw AppError.badRequest('Please specify the requested amount.');

  const old = await db('general_procurement_requests').where('id', req.params.id).first();
  if (!old || old.status !== 'ACCEPTED') throw AppError.badRequest('Can only request payment for accepted items.');

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: 'PAYMENT_REQUESTED',
    requested_amount,
    payment_requested_at: db.fn.now()
  });

  const updated = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: 'PURCHASE_REQUEST_PAYMENT_GENERAL_PROCUREMENT',
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: old,
    afterState: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Notify Finance that a payment request is waiting
  await sendFinanceNotification({
    title: 'New Payment Request',
    message: `Payment of ETB ${Number(requested_amount).toLocaleString()} requested for "${old.item_name}".`,
    type: 'finance',
    link: '/finance/general-procurement?tab=pending-payment',
    related_entity_id: req.params.id
  }, req.app?.get('io')).catch(e => console.error('Failed to notify Finance:', e));

  res.json({ status: 'success', message: 'Payment requested from Finance.' });
});

exports.getFinancePending = catchAsync(async (req, res) => {
  const requests = await db('general_procurement_requests')
    .where('status', 'PAYMENT_REQUESTED')
    .orderBy('payment_requested_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.getFinanceAll = catchAsync(async (req, res) => {
  const requests = await db('general_procurement_requests')
    .whereIn('status', ['PAYMENT_REQUESTED', 'FINANCE_CHECKED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PAID'])
    .orderBy('payment_requested_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.financeCheck = catchAsync(async (req, res) => {
  const { note } = req.body;
  const old = await db('general_procurement_requests').where('id', req.params.id).first();

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: 'FINANCE_CHECKED',
    finance_note: note || null,
    finance_checked_by: req.user ? req.user.id : 1,
    finance_checked_at: db.fn.now()
  });

  const updated = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: 'FINANCE_CHECK_GENERAL_PROCUREMENT',
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: old,
    afterState: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.json({ status: 'success', message: 'Forwarded to CEO for final payment approval.' });
});

exports.getPaymentPending = catchAsync(async (req, res) => {
  const requests = await db('general_procurement_requests')
    .where('status', 'FINANCE_CHECKED')
    .orderBy('finance_checked_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.decidePayment = catchAsync(async (req, res) => {
  const { decision, reason } = req.body; // decision: APPROVE, REJECT
  const statusMap = { 'APPROVE': 'PAYMENT_APPROVED', 'REJECT': 'PAYMENT_REJECTED' };
  const newStatus = statusMap[decision];
  if (!newStatus) throw AppError.badRequest('Invalid decision');
  
  const oldRequest = await db('general_procurement_requests').where('id', req.params.id).first();
  const existingReason = oldRequest.ceo_decision_reason ? oldRequest.ceo_decision_reason + '\n' : '';
  const newReason = reason ? `[Payment Decision Note]: ${reason}` : '';

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: newStatus,
    ceo_decision_reason: newReason ? existingReason + newReason : existingReason,
    payment_decided_by: req.user ? req.user.id : 1,
    payment_decided_at: db.fn.now()
  });
  
  const newRequest = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: `CEO_${decision}_PAYMENT_GENERAL_PROCUREMENT`,
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: oldRequest,
    afterState: newRequest,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // CEO payment decision → Finance pays, or Purchase learns it bounced
  if (decision === 'APPROVE') {
    sendFinanceNotification({
      title: 'Payment Approved — Disburse',
      message: `Payment of ETB ${Number(oldRequest.requested_amount || oldRequest.estimated_cost || 0).toLocaleString()} approved for "${oldRequest.item_name}".`,
      type: 'finance',
      link: '/finance/general-procurement?tab=pending-payment',
      related_entity_id: newRequest.id
    }, req.app?.get('io')).catch(() => {});
  } else {
    sendPurchaseNotification({
      title: `❌ Payment Rejected for ${newRequest.request_code}`,
      message: `${newRequest.item_name}${reason ? ' — Reason: ' + reason : ''}`,
      type: 'error',
      link: '/purchase/general-requests',
      related_entity_id: newRequest.id
    }, req.app?.get('io')).catch(() => {});
  }

  res.json({ status: 'success', message: `Payment ${newStatus === 'PAYMENT_APPROVED' ? 'Approved' : 'Rejected'}` });
});

exports.getMyRequests = catchAsync(async (req, res) => {
  const { module } = req.query;
  const query = db('general_procurement_requests');
  if (module) query.where('module', module);
  // Optional: could filter by req.user.id, but usually managers want to see all for their department
  // For now, let's just return all for the module (Agri & Car Rental)
  const requests = await query.orderBy('created_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.completeTender = catchAsync(async (req, res) => {
  const { tender_reference } = req.body;
  const oldRequest = await db('general_procurement_requests').where('id', req.params.id).first();
  const allowedStatuses = ['ACCEPTED', 'PAYMENT_REQUESTED', 'FINANCE_CHECKED', 'PAYMENT_APPROVED', 'PAID'];
  if (!oldRequest || !allowedStatuses.includes(oldRequest.status)) {
    throw AppError.badRequest('Cannot open a tender for this request in its current state.');
  }

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: 'COMPLETED',
    completed_at: db.fn.now(),
    tender_reference: tender_reference || null
  });

  const updated = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: 'PURCHASE_COMPLETE_TENDER_GENERAL_PROCUREMENT',
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: oldRequest,
    afterState: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.json({ status: 'success', message: 'Marked as completed via tender.' });
});

exports.payRequest = catchAsync(async (req, res) => {
  const { amount, notes } = req.body;
  const oldRequest = await db('general_procurement_requests').where('id', req.params.id).first();
  
  if (!oldRequest || oldRequest.status !== 'PAYMENT_APPROVED') {
    throw AppError.badRequest('Can only pay requests that are approved for payment.');
  }

  const existingReason = oldRequest.ceo_decision_reason ? oldRequest.ceo_decision_reason + '\n' : '';
  const newReason = notes ? `[Finance Payment Note]: ${notes}` : '';

  await db('general_procurement_requests').where('id', req.params.id).update({
    status: 'PAID',
    paid_at: db.fn.now(),
    paid_by: req.user ? req.user.id : 1,
    paid_amount: amount || oldRequest.requested_amount || oldRequest.estimated_cost,
    ceo_decision_reason: newReason ? existingReason + newReason : existingReason
  });

  const updated = await db('general_procurement_requests').where('id', req.params.id).first();

  await logAudit({
    userId: req.user ? req.user.id : 1,
    action: 'FINANCE_PAID_GENERAL_PROCUREMENT',
    resource: 'General Procurement',
    resourceId: req.params.id,
    beforeState: oldRequest,
    afterState: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Purchase office: money is out, proceed with the purchase
  sendPurchaseNotification({
    title: `💵 Payment Made — ${updated.request_code}`,
    message: `ETB ${Number(updated.paid_amount || 0).toLocaleString()} paid for "${updated.item_name}". You can complete the purchase.`,
    type: 'success',
    link: '/purchase/general-requests',
    related_entity_id: updated.id
  }, req.app?.get('io')).catch(() => {});

  res.json({ status: 'success', message: 'Payment successfully recorded.' });
});
