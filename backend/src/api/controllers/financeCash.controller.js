const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

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

  // Record in Cashbook
  await db('finance_cashbook').insert({
    date,
    type: 'CRV',
    reference: crvNumber,
    description: `Received from ${receivedFrom}: ${description}`,
    receipts: amount,
    payments: 0
  });

  notify(req, '💰 CRV Created', `New Receipt Voucher ${crvNumber} created`, '/finance/cash-book', 'success');

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

exports.createPV = catchAsync(async (req, res) => {
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
    throw AppError.badRequest('Missing required PV fields');
  }

  // Generate PV Number
  const lastPv = await db('finance_pvs').orderBy('id', 'desc').first();
  const nextSeq = (lastPv?.id || 0) + 1;
  const pvNumber = `PV-${new Date(date).getFullYear()}-${String(nextSeq).padStart(4, '0')}`;

  const pvData = {
    pv_number: pvNumber,
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
  };

  if (paymentMethod === 'Bank' && bankDetails) {
    pvData.bank_name = bankDetails.bankName;
    pvData.account_holder = bankDetails.accountHolder;
    pvData.account_number = bankDetails.accountNumber;
    pvData.cheque_no = bankDetails.chequeNo;
  }

  if (paymentMethod === 'Telebirr' && telebirrDetails) {
    pvData.telebirr_number = telebirrDetails.telebirrNumber;
    pvData.telebirr_name = telebirrDetails.fullName;
  }

  const [pvId] = await db('finance_pvs').insert(pvData);

  // Record in Cashbook (as payment)
  await db('finance_cashbook').insert({
    date,
    type: 'PV',
    reference: pvNumber,
    description: `Paid to ${paidTo}: ${description}`,
    receipts: 0,
    payments: amount
  });

  notify(req, '💸 PV Created', `New Payment Voucher ${pvNumber} created`, '/finance/cash-book', 'info');

  res.status(201).json({
    status: 'success',
    message: 'PV created successfully',
    data: { id: pvId, pvNumber }
  });
});

exports.getPVs = catchAsync(async (req, res) => {
  const pvs = await db('finance_pvs').orderBy('id', 'desc');
  res.json({ status: 'success', data: pvs });
});

exports.getPVById = catchAsync(async (req, res) => {
  const pv = await db('finance_pvs').where({ id: req.params.id }).first();
  if (!pv) throw AppError.notFound('PV not found');
  res.json({ status: 'success', data: pv });
});

exports.createPCV = catchAsync(async (req, res) => {
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

  if (!date || !paidTo || !amount || !description) {
    throw AppError.badRequest('Missing required PCV fields');
  }

  // Generate PCV Number
  const lastPcv = await db('finance_pcvs').orderBy('id', 'desc').first();
  const nextSeq = (lastPcv?.id || 0) + 1;
  const pcvNumber = `PCV-${new Date(date).getFullYear()}-${String(nextSeq).padStart(4, '0')}`;

  const pcvData = {
    pcv_number: pcvNumber,
    date,
    paid_to: paidTo,
    amount,
    payment_method: paymentMethod || 'Cash',
    description,
    reference_no: referenceNo || null,
    prepared_by: preparedBy || null,
    checked_by: checkedBy || null,
    receiver_name: receiverName || null,
    prepared_signature: preparedSignature || null,
    checked_signature: checkedSignature || null,
    receiver_signature: receiverSignature || null,
    status: 'pending_ceo',
  };

  if (paymentMethod === 'Bank' && bankDetails) {
    pcvData.bank_name = bankDetails.bankName;
    pcvData.account_holder = bankDetails.accountHolder;
    pcvData.account_number = bankDetails.accountNumber;
    pcvData.cheque_no = bankDetails.chequeNo;
  }

  if (paymentMethod === 'Telebirr' && telebirrDetails) {
    pcvData.telebirr_number = telebirrDetails.telebirrNumber;
    pcvData.telebirr_name = telebirrDetails.fullName;
  }

  const [pcvId] = await db('finance_pcvs').insert(pcvData);

  notify(req, '💰 New PCV for Approval', `Petty Cash Voucher ${pcvNumber} is awaiting CEO approval.`, '/ceo/finance', 'warning');

  res.status(201).json({
    status: 'success',
    message: 'PCV sent to CEO for approval',
    data: { id: pcvId, pcvNumber }
  });
});

exports.getPCVs = catchAsync(async (req, res) => {
  const pcvs = await db('finance_pcvs').orderBy('id', 'desc');
  res.json({ status: 'success', data: pcvs });
});

exports.getPendingPCVs = catchAsync(async (req, res) => {
  const pcvs = await db('finance_pcvs').whereIn('status', ['pending_ceo', 'approved_finance', 'rejected', 'completed']).orderBy('id', 'desc');
  res.json({ status: 'success', data: pcvs });
});

exports.getFinanceNotifications = catchAsync(async (req, res) => {
  const pcvs = await db('finance_pcvs')
    .whereIn('status', ['approved_finance', 'rejected'])
    .where('finance_read', false)
    .orderBy('id', 'desc');
  res.json({ status: 'success', data: pcvs });
});

exports.markFinanceRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('finance_pcvs').where({ id }).update({ finance_read: true });
  res.json({ status: 'success', message: 'Marked as read' });
});

exports.approvePCV = catchAsync(async (req, res) => {
  const { id } = req.params;
  const pcv = await db('finance_pcvs').where({ id }).first();
  if (!pcv) throw AppError.notFound('PCV not found');

  await db('finance_pcvs').where({ id }).update({ status: 'approved_finance' });
  notify(req, '✅ PCV Approved', `PCV ${pcv.pcv_number} approved by CEO. Click to continue.`, '/finance/pcv', 'success');

  res.json({ status: 'success', message: 'PCV approved successfully' });
});

exports.rejectPCV = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const pcv = await db('finance_pcvs').where({ id }).first();
  if (!pcv) throw AppError.notFound('PCV not found');

  await db('finance_pcvs').where({ id }).update({ status: 'rejected', reject_reason: reason });
  notify(req, '❌ PCV Rejected', `PCV ${pcv.pcv_number} was rejected by CEO.`, '/finance/pcv', 'error');

  res.json({ status: 'success', message: 'PCV rejected successfully' });
});

exports.finalizePCV = catchAsync(async (req, res) => {
  const { id } = req.params;
  const pcv = await db('finance_pcvs').where({ id, status: 'approved_finance' }).first();
  if (!pcv) throw AppError.badRequest('PCV not found or not approved');

  await db('finance_pcvs').where({ id }).update({ status: 'completed' });

  // Record in Cashbook
  await db('finance_cashbook').insert({
    date: pcv.date,
    type: 'PCV',
    reference: pcv.pcv_number,
    description: `Petty Cash to ${pcv.paid_to}: ${pcv.description}`,
    receipts: 0,
    payments: pcv.amount
  });

  notify(req, '✅ PCV Completed', `PCV ${pcv.pcv_number} has been finalized and recorded in the cashbook by Finance.`, '/ceo/finance', 'success');
  res.json({ status: 'success', message: 'PCV recorded in cashbook' });
});

exports.getPCVById = catchAsync(async (req, res) => {
  const pcv = await db('finance_pcvs').where({ id: req.params.id }).first();
  if (!pcv) throw AppError.notFound('PCV not found');
  res.json({ status: 'success', data: pcv });
});
