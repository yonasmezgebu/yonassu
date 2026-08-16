const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const vatConfigService = require('../../services/vatConfig.service');

// Helper to notify clients
const notify = (req, title, message, link, type = 'info') => {
  try {
    const io = req.app?.get('io');
    if (io) {
      io.emit('pharmacy-transfer', { title, message, type, link });
    }
  } catch (e) {
    console.error('Socket Notification failed:', e);
  }
};

// ─── FUND REQUESTS ────────────────────────────────────────────────────────
exports.createFundRequest = catchAsync(async (req, res) => {
  const { tenderIds } = req.body; // Array of awarded public_tender_ids
  if (!tenderIds || tenderIds.length === 0) throw AppError.badRequest('No tenders selected');

  // Verify tenders are awarded
  const tenders = await db('public_tenders').whereIn('id', tenderIds);
  if (tenders.length !== tenderIds.length) throw AppError.badRequest('Invalid tender IDs');
  if (tenders.some(t => t.status !== 'awarded')) throw AppError.badRequest('Only awarded tenders can be requested for funds');

  // Verify that these tenders haven't already been requested
  const existingRequests = await db('public_fund_request_items').whereIn('public_tender_id', tenderIds);
  if (existingRequests.length > 0) {
    const alreadyRequestedIds = existingRequests.map(er => er.public_tender_id);
    const affectedTenders = tenders.filter(t => alreadyRequestedIds.includes(t.id)).map(t => t.tender_number || `TND-${t.id}`);
    throw AppError.badRequest(`A fund request has already been submitted for tender(s): ${affectedTenders.join(', ')}`);
  }

  // Calculate total amount from winning bids
  const winningBids = await db('public_bids')
    .whereIn('public_tender_id', tenderIds)
    .andWhere({ bid_status: 'winner' });

  if (winningBids.length === 0) throw AppError.badRequest('No winning bids found for selected tenders');

  // We need to calculate based on public_bid_items
  const winningBidIds = winningBids.map(b => b.id);
  const bidItems = await db('public_bid_items').whereIn('public_bid_id', winningBidIds);

  let totalAmount = 0;
  let totalVat = 0;
  const requestItems = [];

  for (const bid of winningBids) {
    const items = bidItems.filter(i => i.public_bid_id === bid.id);
    let amountForBid = 0;
    let vatForBid = 0;
    for (const item of items) {
      const lineAmount = item.total_birr + (item.total_cent / 100);
      amountForBid += lineAmount;
      const vatCalc = await vatConfigService.computeVatForItem('tender_buy', item.public_tender_item_id || null, lineAmount);
      vatForBid += parseFloat(vatCalc.vat.toFixed(2));
    }
    totalAmount += amountForBid;
    totalVat += vatForBid;

    requestItems.push({
      public_tender_id: bid.public_tender_id,
      public_bid_id: bid.id,
      amount: amountForBid,
      vat_amount: parseFloat(vatForBid.toFixed(2))
    });
  }

  // Generate Request Code
  const lastReq = await db('public_fund_requests').orderBy('id', 'desc').first();
  const nextSeq = (lastReq?.id || 0) + 1;
  const reqCode = `PFR-${new Date().getFullYear()}-${String(nextSeq).padStart(4, '0')}`;

  const [fundRequestId] = await db('public_fund_requests').insert({
    request_code: reqCode,
    total_amount: parseFloat((totalAmount + totalVat).toFixed(2)),
    vat_amount: parseFloat(totalVat.toFixed(2)),
    created_by: req.user.id,
    status: 'PENDING_CEO'
  });

  const insertItems = requestItems.map(item => ({
    fund_request_id: fundRequestId,
    ...item
  }));

  await db('public_fund_request_items').insert(insertItems);

  // Notify CEO
  notify(req, '💰 New Fund Request', `Request ${reqCode} requires approval`, '/ceo/tenders', 'info');

  res.status(201).json({ status: 'success', message: 'Fund Request Created', data: { id: fundRequestId } });
});

exports.getFundRequests = catchAsync(async (req, res) => {
  const requests = await db('public_fund_requests').orderBy('created_at', 'desc');
  for (const req of requests) {
    const items = await db('public_fund_request_items')
      .join('public_tenders', 'public_fund_request_items.public_tender_id', 'public_tenders.id')
      .join('public_bids', 'public_fund_request_items.public_bid_id', 'public_bids.id')
      .select('public_fund_request_items.*', 'public_tenders.title as tender_title', 'public_bids.competitor_name as supplier')
      .where('fund_request_id', req.id);
      
    // Fetch individual product details for each awarded bid
    for (const item of items) {
      item.products = await db('public_bid_items')
        .join('public_tender_items', 'public_bid_items.public_tender_item_id', 'public_tender_items.id')
        .select(
          'public_tender_items.object_type as item_name',
          'public_tender_items.quantity',
          'public_bid_items.price_birr',
          'public_bid_items.price_cent',
          'public_bid_items.total_birr',
          'public_bid_items.total_cent'
        )
        .where('public_bid_items.public_bid_id', item.public_bid_id);
    }
    req.items = items;
  }
  res.json({ status: 'success', data: requests });
});

exports.approveFundRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body; // 'APPROVE' or 'REJECT'

  const request = await db('public_fund_requests').where({ id }).first();
  if (!request) throw AppError.notFound('Fund Request not found');

  const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  
  await db('public_fund_requests').where({ id }).update({
    status,
    decided_by: req.user.id,
    decision_reason: reason || null,
    decided_at: db.fn.now()
  });

  if (status === 'APPROVED') {
    const title = '✅ Fund Request Approved';
    const message = `Request ${request.request_code} was approved by CEO. Please verify budget and create payment.`;
    const link = '/finance/flow2-funds';
    notify(req, title, message, link, 'success');
    // Also persist to V2 notifications DB so Finance sees it in the page banner
    try {
      // Find finance users to notify
      const financeUsers = await db('users').where({ role: 'Finance' }).orWhere({ role: 'finance' }).select('id');
      if (financeUsers.length > 0) {
        const notifRows = financeUsers.map(u => ({
          user_id: u.id, title, message, link, type: 'finance',
          is_read: false
        }));
        await db('notifications').insert(notifRows).catch(() => {});
      }
    } catch (_) { /* non-critical */ }
  } else {
    const title = '❌ Fund Request Rejected';
    const message = `Request ${request.request_code} was rejected by CEO. Reason: ${reason || 'No reason given.'}`;
    const link = '/purchase/smart-tenders?tab=fund_requests';
    notify(req, title, message, link, 'error');
    // Persist to purchase users
    try {
      const purchaseUsers = await db('users').where({ role: 'Purchase Manager' }).orWhere({ role: 'purchase' }).select('id');
      if (purchaseUsers.length > 0) {
        const notifRows = purchaseUsers.map(u => ({
          user_id: u.id, title, message, link, type: 'general',
          is_read: false
        }));
        await db('notifications').insert(notifRows).catch(() => {});
      }
    } catch (_) { /* non-critical */ }
  }

  res.json({ status: 'success', message: `Fund Request ${status}` });
});

exports.verifyFundRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const request = await db('public_fund_requests').where({ id }).first();
  if (!request) throw AppError.notFound('Fund Request not found');
  if (request.status !== 'APPROVED') throw AppError.badRequest('Only APPROVED requests can be verified for payment');

  await db('public_fund_requests').where({ id }).update({
    status: 'READY_FOR_PAYMENT'
  });

  // Notify Purchase that we are processing
  try {
    const purchaseUsers = await db('users').where({ role: 'Purchase Manager' }).orWhere({ role: 'purchase' }).select('id');
    if (purchaseUsers.length > 0) {
      const notifRows = purchaseUsers.map(u => ({
        user_id: u.id,
        title: '⚙️ Fund Request Processing',
        message: `Request ${request.request_code} is being processed by Finance.`,
        link: '/purchase/smart-tenders?tab=fund_requests',
        type: 'general',
        is_read: false
      }));
      await db('notifications').insert(notifRows).catch(() => {});
    }
  } catch (_) {}

  notify(req, '⚙️ Fund Request Processing', `Request ${request.request_code} is being processed by Finance.`, '/finance/flow2-funds', 'success');

  res.json({ status: 'success', message: 'Fund Request marked as Processing' });
});

// ─── DELIVERIES ───────────────────────────────────────────────────────────
exports.getDeliveries = catchAsync(async (req, res) => {
  const deliveries = await db('public_deliveries')
    .join('public_tenders', 'public_deliveries.public_tender_id', 'public_tenders.id')
    .select('public_deliveries.*', 'public_tenders.title as tender_title', 'public_tenders.tender_number')
    .orderBy('public_deliveries.created_at', 'desc');
  res.json({ status: 'success', data: deliveries });
});

exports.receiveDelivery = catchAsync(async (req, res) => {
  const { tenderId } = req.params;
  const { notes } = req.body;

  const tender = await db('public_tenders').where({ id: tenderId }).first();
  if (!tender) throw AppError.notFound('Tender not found');

  // Upsert delivery record
  const existing = await db('public_deliveries').where({ public_tender_id: tenderId }).first();
  if (existing) {
    if (existing.status === 'RECEIVED') throw AppError.badRequest('Delivery already received');
    await db('public_deliveries').where({ id: existing.id }).update({
      status: 'RECEIVED',
      received_by: req.user.id,
      received_at: db.fn.now(),
      notes: notes || existing.notes
    });
  } else {
    await db('public_deliveries').insert({
      public_tender_id: tenderId,
      status: 'RECEIVED',
      received_by: req.user.id,
      received_at: db.fn.now(),
      notes
    });
  }

  // Update tender status for easier querying
  await db('public_tenders').where({ id: tenderId }).update({ delivery_status: 'RECEIVED' });

  notify(req, '📦 Delivery Received', `Items for Tender ${tender.tender_number || tenderId} have been received`, '/finance/procurement', 'success');

  res.json({ status: 'success', message: 'Delivery marked as received' });
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────
exports.getPayments = catchAsync(async (req, res) => {
  const payments = await db('public_payments')
    .join('public_fund_requests', 'public_payments.fund_request_id', 'public_fund_requests.id')
    .select('public_payments.*', 'public_fund_requests.request_code')
    .orderBy('public_payments.created_at', 'desc');
  res.json({ status: 'success', data: payments });
});

exports.createPayment = catchAsync(async (req, res) => {
  const { fundRequestId } = req.body;
  const request = await db('public_fund_requests').where({ id: fundRequestId }).first();
  if (!request) throw AppError.notFound('Fund Request not found');
  if (request.status !== 'READY_FOR_PAYMENT') throw AppError.badRequest('Fund request must be in Processing status. Please click "Mark Processing" first.');

  const items = await db('public_fund_request_items').where({ fund_request_id: fundRequestId });
  const tenderIds = items.map(i => i.public_tender_id);

  // Create payment record
  try {
    const receiptCode = `RCPT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    await db('public_payments').insert({
      fund_request_id: fundRequestId,
      amount: request.total_amount,
      status: 'PAID',
      paid_by: req.user.id,
      paid_at: db.fn.now(),
      receipt_code: receiptCode
    });

    // Update tender payment_status & fund request status
    await db('public_tenders').whereIn('id', tenderIds).update({ payment_status: 'PAID' });
    await db('public_fund_requests').where({ id: fundRequestId }).update({ status: 'PAID' });

    const paidTitle = '💳 Payment Confirmed – PAID';
    const paidMsg = `Payment for ${request.request_code} has been processed. Receipt: ${receiptCode}`;

    notify(req, paidTitle, paidMsg, '/purchase/smart-tenders?tab=fund_requests', 'success');

    // Notify purchase users
    try {
      const purchaseUsers = await db('users').where({ role: 'Purchase Manager' }).orWhere({ role: 'purchase' }).select('id');
      if (purchaseUsers.length > 0) {
        const notifRows = purchaseUsers.map(u => ({
          user_id: u.id, title: paidTitle, message: paidMsg,
          link: '/purchase/smart-tenders?tab=fund_requests', type: 'general', is_read: false
        }));
        await db('notifications').insert(notifRows).catch(() => {});
      }
    } catch (_) {}

    res.json({ status: 'success', message: 'Payment created successfully', data: { receiptCode } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw AppError.badRequest('A payment for this fund request already exists');
    }
    throw err;
  }
});

// ─── NOTIFICATIONS (Mark Read) ──────────────────────────────────────────────
exports.markNotificationRead = catchAsync(async (req, res) => {
  const { entityId, entityType, roleField } = req.body;
  // entityType: 'public_fund_requests' | 'public_deliveries'
  // roleField: 'ceo_read' | 'finance_read' | 'purchase_read' | 'store_read'

  if (!['public_fund_requests', 'public_deliveries'].includes(entityType)) {
    throw AppError.badRequest('Invalid entity type');
  }

  const allowedFields = ['ceo_read', 'finance_read', 'purchase_read', 'store_read'];
  if (!allowedFields.includes(roleField)) {
    throw AppError.badRequest('Invalid role field');
  }

  await db(entityType).where({ id: entityId }).update({ [roleField]: true });
  res.json({ status: 'success', message: 'Marked as read' });
});
