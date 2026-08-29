const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendCeoNotification, sendFinanceNotification } = require('../../services/notification.service');

// Helper to notify clients (if needed)
const notify = (req, title, message, link, type = 'info') => {
  try {
    const io = req.app?.get('io');
    if (io) {
      io.emit('finance-cash', { title, message, type, link });
    }
  } catch (e) {
    console.error('Socket Notification failed:', e);
  }
};

exports.createCRV = catchAsync(async (req, res) => {
  const {
    date,
    receivedFrom,
    amount,
    paymentMethod,
    description,
    referenceNo,
    bankDetails,
    telebirrDetails,
    preparedBy,
    checkedBy,
    receiverName,
    preparedSignature,
    checkedSignature,
    receiverSignature
  } = req.body;

  if (!date || !receivedFrom || !amount || !paymentMethod || !description) {
    throw AppError.badRequest('Missing required CRV fields');
  }

  // Generate CRV Number
  const lastCrv = await db('finance_crvs').orderBy('id', 'desc').first();
  const nextSeq = (lastCrv?.id || 0) + 1;
  const crvNumber = `CRV-${new Date(date).getFullYear()}-${String(nextSeq).padStart(4, '0')}`;

  const crvData = {
    crv_number: crvNumber,
    date,
    received_from: receivedFrom,
    amount,
    payment_method: paymentMethod,
    description,
    reference_no: referenceNo || null,
    prepared_by: preparedBy || null,
    checked_by: checkedBy || null,
    receiver_name: receiverName || null,
    prepared_signature: preparedSignature || null,
    checked_signature: checkedSignature || null,
    receiver_signature: receiverSignature || null,
  };

  if (paymentMethod === 'Bank' && bankDetails) {
    crvData.bank_name = bankDetails.bankName;
    crvData.account_holder = bankDetails.accountHolder;
    crvData.account_number = bankDetails.accountNumber;
    crvData.cheque_no = bankDetails.chequeNo;
  }

  if (paymentMethod === 'Telebirr' && telebirrDetails) {
    crvData.telebirr_number = telebirrDetails.telebirrNumber;
    crvData.telebirr_name = telebirrDetails.fullName;
  }

  const [crvId] = await db('finance_crvs').insert(crvData);

  notify(req, '💰 CRV Created', `New Receipt Voucher ${crvNumber} created`, '/finance/crv', 'success');
  sendFinanceNotification({
    title: 'Receipt Voucher Created',
    message: `CRV ${crvNumber}: ETB ${Number(amount || 0).toLocaleString()} received from ${receivedFrom}.`,
    type: 'finance',
    link: '/finance/crv',
    related_entity_id: crvId
  }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

  res.status(201).json({
    status: 'success',
    message: 'CRV created successfully',
    data: { id: crvId, crvNumber }
  });
});

exports.getCashBook = catchAsync(async (req, res) => {
  const cashbook = await db('finance_cashbook').orderBy('date', 'asc').orderBy('id', 'asc');
  res.json({ status: 'success', data: cashbook });
});

exports.getCRVs = catchAsync(async (req, res) => {
  const crvs = await db('finance_crvs').orderBy('id', 'desc');
  res.json({ status: 'success', data: crvs });
});

exports.getCRVById = catchAsync(async (req, res) => {
  const crv = await db('finance_crvs').where({ id: req.params.id }).first();
  if (!crv) throw AppError.notFound('CRV not found');
  res.json({ status: 'success', data: crv });
});

exports.createEV = catchAsync(async (req, res) => {
  const {
    date,
    paidTo,
    amount,
    paymentMethod,
    description,
    referenceNo,
    bankDetails,
    telebirrDetails,
    preparedBy,
    checkedBy,
    receiverName,
    preparedSignature,
    checkedSignature,
    receiverSignature
  } = req.body;

  if (!date || !paidTo || !amount || !paymentMethod || !description) {
    throw AppError.badRequest('Missing required EV fields');
  }

  // Generate EV Number
  const lastEv = await db('finance_evs').orderBy('id', 'desc').first();
  const nextSeq = (lastEv?.id || 0) + 1;
  const evNumber = `EV-${new Date(date).getFullYear()}-${String(nextSeq).padStart(4, '0')}`;

  const evData = {
    ev_number: evNumber,
    date,
    paid_to: paidTo,
    amount,
    payment_method: paymentMethod,
    description,
    reference_no: referenceNo || null,
    prepared_by: preparedBy || null,
    checked_by: checkedBy || null,
    receiver_name: receiverName || null,
    prepared_signature: preparedSignature || null,
    checked_signature: checkedSignature || null,
    receiver_signature: receiverSignature || null,
    status: 'pending_ceo',
    source: 'manual',
  };

  if (paymentMethod === 'Bank' && bankDetails) {
    evData.bank_name = bankDetails.bankName;
    evData.account_holder = bankDetails.accountHolder;
    evData.account_number = bankDetails.accountNumber;
    evData.cheque_no = bankDetails.chequeNo;
  }

  if (paymentMethod === 'Telebirr' && telebirrDetails) {
    evData.telebirr_number = telebirrDetails.telebirrNumber;
    evData.telebirr_name = telebirrDetails.fullName;
  }

  const [evId] = await db('finance_evs').insert(evData);

  notify(req, '💰 New Expense Voucher for Approval', `Expense Voucher ${evNumber} is awaiting CEO approval.`, '/ceo/finance', 'warning');
  // Persist to the CEO bell — expense needs CEO approval
  sendCeoNotification({
    title: 'Expense Voucher Awaiting Approval',
    message: `EV ${evNumber}: ETB ${Number(amount || 0).toLocaleString()} to ${paidTo} needs your approval.`,
    type: 'general',
    link: '/ceo/finance',
    related_entity_id: evId
  }, req.app?.get('io')).catch(e => console.error('Failed to notify CEO:', e.message));

  res.status(201).json({
    status: 'success',
    message: 'Expense voucher sent to CEO for approval',
    data: { id: evId, evNumber }
  });
});

exports.getEVs = catchAsync(async (req, res) => {
  const evs = await db('finance_evs').orderBy('id', 'desc');
  res.json({ status: 'success', data: evs });
});

exports.getPendingEVs = catchAsync(async (req, res) => {
  const evs = await db('finance_evs').whereIn('status', ['pending_ceo', 'approved_finance', 'rejected', 'completed']).orderBy('id', 'desc');
  res.json({ status: 'success', data: evs });
});

exports.getFinanceNotifications = catchAsync(async (req, res) => {
  const evs = await db('finance_evs')
    .whereIn('status', ['approved_finance', 'rejected'])
    .where('finance_read', false)
    .orderBy('id', 'desc');
  res.json({ status: 'success', data: evs });
});

exports.markFinanceRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('finance_evs').where({ id }).update({ finance_read: true });
  res.json({ status: 'success', message: 'Marked as read' });
});

exports.approveEV = catchAsync(async (req, res) => {
  const { id } = req.params;
  const ev = await db('finance_evs').where({ id }).first();
  if (!ev) throw AppError.notFound('Expense voucher not found');

  await db('finance_evs').where({ id }).update({ status: 'approved_finance' });
  notify(req, '✅ Expense Voucher Approved', `Expense Voucher ${ev.ev_number} approved by CEO. Click to continue.`, '/finance/ev', 'success');
  // Persist to the Finance bell — CEO approved this expense
  sendFinanceNotification({
    title: 'Expense Approved by CEO',
    message: `EV ${ev.ev_number} (ETB ${Number(ev.amount || 0).toLocaleString()} to ${ev.paid_to}) was approved by CEO. You can finalize the payment.`,
    type: 'finance',
    link: '/finance/ev?tab=history',
    related_entity_id: id
  }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

  res.json({ status: 'success', message: 'Expense voucher approved successfully' });
});

exports.rejectEV = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const ev = await db('finance_evs').where({ id }).first();
  if (!ev) throw AppError.notFound('Expense voucher not found');

  await db('finance_evs').where({ id }).update({ status: 'rejected', reject_reason: reason });
  notify(req, '❌ Expense Voucher Rejected', `Expense Voucher ${ev.ev_number} was rejected by CEO.`, '/finance/ev', 'error');
  // Persist to the Finance bell — CEO rejected this expense
  sendFinanceNotification({
    title: 'Expense Rejected by CEO',
    message: `EV ${ev.ev_number} (ETB ${Number(ev.amount || 0).toLocaleString()} to ${ev.paid_to}) was rejected by CEO.${reason ? ' Reason: ' + reason : ''}`,
    type: 'finance',
    link: '/finance/ev?tab=history',
    related_entity_id: id
  }, req.app?.get('io')).catch(e => console.error('Failed to notify finance:', e.message));

  res.json({ status: 'success', message: 'Expense voucher rejected successfully' });
});

exports.finalizeEV = catchAsync(async (req, res) => {
  const { id } = req.params;
  const ev = await db('finance_evs').where({ id, status: 'approved_finance' }).first();
  if (!ev) throw AppError.badRequest('Expense voucher not found or not approved');

  await db('finance_evs').where({ id }).update({ status: 'completed' });

  // Record in Cashbook only when finalized (single consistent rule)
  await db('finance_cashbook').insert({
    date: ev.date,
    type: 'EV',
    reference: ev.ev_number,
    description: `Paid to ${ev.paid_to}: ${ev.description}`,
    receipts: 0,
    payments: ev.amount
  });

  notify(req, '✅ Expense Voucher Completed', `Expense Voucher ${ev.ev_number} has been finalized and recorded in the cashbook by Finance.`, '/ceo/finance', 'success');
  // Persist to the CEO bell — payment completed by Finance
  sendCeoNotification({
    title: 'Expense Payment Completed',
    message: `EV ${ev.ev_number} (ETB ${Number(ev.amount || 0).toLocaleString()}) was paid and recorded in the cashbook.`,
    type: 'general',
    link: '/ceo/finance',
    related_entity_id: id
  }, req.app?.get('io')).catch(e => console.error('Failed to notify CEO:', e.message));
  res.json({ status: 'success', message: 'Expense voucher recorded in cashbook' });
});

exports.getEVById = catchAsync(async (req, res) => {
  const ev = await db('finance_evs').where({ id: req.params.id }).first();
  if (!ev) throw AppError.notFound('Expense voucher not found');
  res.json({ status: 'success', data: ev });
});