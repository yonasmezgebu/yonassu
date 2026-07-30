const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const notificationRepository = require('../../repositories/notification.repository');

exports.submitBid = catchAsync(async (req, res) => {
  const { bid_price_per_unit, quantity_requested, proposed_pickup_date, notes, items,
    bidder_full_name, bidder_email, bidder_phone, digital_signature } = req.body;
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'open') throw AppError.badRequest('This tender is not accepting bids');
  if (new Date(tender.deadline) < new Date()) throw AppError.badRequest('Bid deadline has passed');
  let qty = parseInt(quantity_requested) || 1;
  let total = 0;
  let isMulti = false;

  if (items && items !== 'null' && items !== '[]') {
    isMulti = true;
    try {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      qty = parsedItems.length;
      total = parsedItems.reduce((acc, item) => acc + (parseFloat(item.bidPriceBirr || 0) + (parseFloat(item.bidPriceCent || 0) / 100)), 0);
    } catch (e) {
      // Ignore parse error
    }
  } else {
    // Single item validation
    if (bid_price_per_unit === undefined || bid_price_per_unit === null || bid_price_per_unit === '' || parseFloat(bid_price_per_unit) < parseFloat(tender.starting_bid_price || 0)) {
      throw AppError.badRequest(`Bid price must be at least ${tender.starting_bid_price || 0} ETB`);
    }
    if (qty > tender.quantity) throw AppError.badRequest(`Requested quantity exceeds available (${tender.quantity})`);
    total = parseFloat(bid_price_per_unit) * qty;
  }

  const existing = await db('bids').where({ tender_id: tender.id, customer_id: req.user.id }).first();

  if (existing) {
    await db('bids').where('id', existing.id).update({
      bid_price_per_unit, quantity_requested: qty, total_bid_value: total,
      proposed_pickup_date: proposed_pickup_date || null,
      notes: notes || null, status: 'pending',
      items: items || null,
      bidder_full_name: bidder_full_name || existing.bidder_full_name || null,
      bidder_email: bidder_email || existing.bidder_email || null,
      bidder_phone: bidder_phone || existing.bidder_phone || null,
      digital_signature: digital_signature || existing.digital_signature || null,
      updated_at: db.fn.now(),
    });
    const bid = await db('bids').where('id', existing.id).first();
    return res.json({ status: 'success', data: bid, message: 'Bid updated' });
  }

  const [id] = await db('bids').insert({
    tender_id: tender.id, customer_id: req.user.id,
    bid_price_per_unit, quantity_requested: qty, total_bid_value: total,
    proposed_pickup_date: proposed_pickup_date || null,
    notes: notes || null,
    items: items || null,
    bidder_full_name: bidder_full_name || null,
    bidder_email: bidder_email || null,
    bidder_phone: bidder_phone || null,
    digital_signature: digital_signature || null,
  });
  const bid = await db('bids').where('id', id).first();
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'New Bid Received', message: `New bid on ${tender.reference_number} — ${tender.title}: contact: ${bidder_full_name || 'N/A'} (${bidder_phone || ''})` });
  res.status(201).json({ status: 'success', data: bid });
});

exports.updateMyBid = catchAsync(async (req, res) => {
  const { bid_price_per_unit, quantity_requested, proposed_pickup_date, notes, items,
    bidder_full_name, bidder_email, bidder_phone, digital_signature } = req.body;
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'open') throw AppError.badRequest('This tender is no longer accepting bids');
  if (new Date(tender.deadline) < new Date()) throw AppError.badRequest('Bid deadline has passed');

  const existing = await db('bids').where({ tender_id: tender.id, customer_id: req.user.id }).first();
  if (!existing) throw AppError.notFound('You have not submitted a bid for this tender yet');

  let qty = parseInt(quantity_requested) || existing.quantity_requested;
  let total = existing.total_bid_value;
  let newPrice = bid_price_per_unit !== undefined ? bid_price_per_unit : existing.bid_price_per_unit;

  if (items && items !== 'null' && items !== '[]') {
    try {
      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      qty = parsedItems.length;
      total = parsedItems.reduce((acc, item) => acc + (parseFloat(item.bidPriceBirr || 0) + (parseFloat(item.bidPriceCent || 0) / 100)), 0);
    } catch (e) {}
  } else if (bid_price_per_unit !== undefined) {
    if (parseFloat(bid_price_per_unit) < parseFloat(tender.starting_bid_price || 0)) {
      throw AppError.badRequest(`Bid price must be at least ${tender.starting_bid_price || 0} ETB`);
    }
    total = parseFloat(bid_price_per_unit) * qty;
  }

  await db('bids').where('id', existing.id).update({
    bid_price_per_unit: newPrice,
    quantity_requested: qty,
    total_bid_value: total,
    proposed_pickup_date: proposed_pickup_date !== undefined ? (proposed_pickup_date || null) : existing.proposed_pickup_date,
    notes: notes !== undefined ? (notes || null) : existing.notes,
    items: items !== undefined ? (items || null) : existing.items,
    bidder_full_name: bidder_full_name !== undefined ? bidder_full_name : existing.bidder_full_name,
    bidder_email: bidder_email !== undefined ? bidder_email : existing.bidder_email,
    bidder_phone: bidder_phone !== undefined ? bidder_phone : existing.bidder_phone,
    digital_signature: digital_signature !== undefined ? digital_signature : existing.digital_signature,
    updated_at: db.fn.now(),
  });

  const bid = await db('bids').where('id', existing.id).first();
  res.json({ status: 'success', data: bid, message: 'Bid updated successfully' });
});

exports.listBids = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  const bids = await db('bids')
    .join('users', 'bids.customer_id', 'users.id')
    .where('bids.tender_id', req.params.tenderId)
    .select('bids.*', 'users.full_name as customer_name', 'users.email as customer_email', 'users.phone as customer_phone')
    .orderBy('bids.total_bid_value', 'desc');
  res.json({ status: 'success', data: bids });
});

exports.getMyBid = catchAsync(async (req, res) => {
  const bid = await db('bids')
    .join('tenders', 'bids.tender_id', 'tenders.id')
    .where('bids.tender_id', req.params.tenderId)
    .where('bids.customer_id', req.user.id)
    .select('bids.*', 'tenders.title as tender_title', 'tenders.reference_number', 'tenders.status as tender_status',
      'tenders.deadline', 'tenders.starting_bid_price', 'tenders.item_name')
    .first();
  if (!bid) return res.json({ status: 'success', data: null });
  res.json({ status: 'success', data: bid });
});

exports.getMyBids = catchAsync(async (req, res) => {
  const bids = await db('bids')
    .join('tenders', 'bids.tender_id', 'tenders.id')
    .where('bids.customer_id', req.user.id)
    .select('bids.*', 'tenders.title as tender_title', 'tenders.reference_number',
      'tenders.status as tender_status', 'tenders.deadline', 'tenders.item_name')
    .orderBy('bids.submitted_at', 'desc')
    .limit(50);
  res.json({ status: 'success', data: bids });
});

exports.disqualify = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw AppError.badRequest('Disqualification reason is required');
  const bid = await db('bids').where('id', req.params.bidId).first();
  if (!bid) throw AppError.notFound('Bid not found');
  await db('bids').where('id', req.params.bidId).update({
    status: 'disqualified', disqualification_reason: reason, evaluation_label: 'disqualified',
    updated_at: db.fn.now(),
  });
  res.json({ status: 'success', message: 'Bid disqualified' });
});

exports.addEvaluation = catchAsync(async (req, res) => {
  const { evaluation_notes, evaluation_label } = req.body;
  const bid = await db('bids').where('id', req.params.bidId).first();
  if (!bid) throw AppError.notFound('Bid not found');
  const updates = { updated_at: db.fn.now() };
  if (evaluation_notes !== undefined) updates.evaluation_notes = evaluation_notes;
  if (evaluation_label !== undefined) updates.evaluation_label = evaluation_label;
  if (evaluation_label) updates.status = 'under_review';
  await db('bids').where('id', req.params.bidId).update(updates);
  res.json({ status: 'success', message: 'Evaluation updated' });
});

exports.award = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'closed' && tender.status !== 'open') {
    throw AppError.badRequest('Tender must be closed or open to award');
  }

  const { bid_ids } = req.body;
  if (!bid_ids || !bid_ids.length) throw AppError.badRequest('Select at least one bid to award');

  const bids = await db('bids').whereIn('id', bid_ids).where('tender_id', req.params.tenderId);
  if (!bids.length) throw AppError.notFound('No valid bids found');

  await db('bids').whereIn('id', bid_ids).update({ status: 'awarded', evaluation_label: 'highest', updated_at: db.fn.now() });
  await db('bids').where('tender_id', req.params.tenderId).whereNotIn('id', bid_ids)
    .whereNot('status', 'disqualified').update({ status: 'not_selected', updated_at: db.fn.now() });

  const firstBid = bids[0];
  await db('tenders').where('id', req.params.tenderId).update({
    status: 'awarded', awarded_bid_id: firstBid.id, updated_at: db.fn.now(),
  });

  for (const b of bids) {
    await notificationRepository.create({ userId: b.customer_id, title: 'Bid Awarded!', message: `Congratulations! Your bid on ${tender.reference_number} — ${tender.title} has been selected.` });
  }
  const notSelected = await db('bids').where('tender_id', req.params.tenderId).where('status', 'not_selected').select('customer_id');
  for (const b of notSelected) {
    await notificationRepository.create({ userId: b.customer_id, title: 'Bid Not Selected', message: `Your bid on ${tender.reference_number} — ${tender.title} was not selected. Thank you for participating.` });
  }
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Awarded', message: `Tender ${tender.reference_number} — ${tender.title} has been awarded.` });

  res.json({ status: 'success', message: 'Bid(s) awarded', data: { awarded: bids.length } });
});

exports.getWinner = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'awarded') throw AppError.badRequest('Tender is not awarded yet');
  
  const myBid = await db('bids').where({ tender_id: tender.id, customer_id: req.user.id }).first();
  if (!myBid && !['Admin', 'CEO', 'Sales Manager'].includes(req.user.role)) {
    throw AppError.forbidden('Only competitors can view the winner');
  }
  
  const winnerBid = await db('bids')
    .join('users', 'bids.customer_id', 'users.id')
    .where('bids.tender_id', tender.id)
    .where('bids.status', 'awarded')
    .select('users.name as winner_name', 'bids.bid_price_per_unit', 'bids.quantity_requested', 'bids.total_bid_value')
    .first();
    
  res.json({ status: 'success', data: winnerBid });
});

exports.forwardToCeo = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  
  await db('bids')
    .where('tender_id', tender.id)
    .whereIn('status', ['submitted', 'pending', 'under_review'])
    .update({
      status: 'forwarded_to_ceo',
      updated_at: db.fn.now()
    });
  
  await db('tenders').where('id', tender.id).update({
    status: 'awaiting_ceo_approval',
    updated_at: db.fn.now()
  });
  
  await notificationRepository.create({ roleTarget: 'CEO', title: 'Tender Bids Forwarded', message: `Bids for tender ${tender.reference_number} have been forwarded for your approval.` });
  res.json({ status: 'success', message: 'Bids forwarded to CEO successfully' });
});

exports.ceoApprove = catchAsync(async (req, res) => {
  const { approvals } = req.body;
  if (!Array.isArray(approvals)) throw AppError.badRequest('Approvals array is required');

  for (const apr of approvals) {
    if (apr.approved) {
      await db('bids').where('id', apr.bidId).update({
        ceo_approval_status: 'approved',
        status: 'awarded',
        updated_at: db.fn.now()
      });
    } else {
      await db('bids').where('id', apr.bidId).update({
        ceo_approval_status: 'rejected',
        status: 'rejected',
        updated_at: db.fn.now()
      });
    }
  }

  // Move the tender to 'awarded' if any bid was approved
  const anyApproved = approvals.some(a => a.approved);
  let tenderData = null;
  if (req.params.tenderId) {
    tenderData = await db('tenders').where('id', req.params.tenderId).first();
  }

  if (anyApproved && req.params.tenderId) {
    await db('tenders').where('id', req.params.tenderId).update({
      status: 'awarded',
      updated_at: db.fn.now()
    });
    
    if (tenderData) {
      await notificationRepository.create({
        roleTarget: 'Sales Manager',
        title: 'CEO Approved Bids',
        message: `The CEO has approved bid(s) for tender ${tenderData.reference_number}.`
      });
    }
  } else if (!anyApproved && tenderData) {
    await notificationRepository.create({
      roleTarget: 'Sales Manager',
      title: 'CEO Rejected Bids',
      message: `The CEO has rejected the forwarded bid(s) for tender ${tenderData.reference_number}.`
    });
  }

  res.json({ status: 'success', message: 'CEO approval saved' });
});

exports.markOpened = catchAsync(async (req, res) => {
  await db('bids').where('id', req.params.bidId).update({
    opened_at: db.fn.now()
  });
  res.json({ status: 'success' });
});

exports.markEmailSent = catchAsync(async (req, res) => {
  await db('bids').where('id', req.params.bidId).update({
    notification_sent: true,
    updated_at: db.fn.now()
  });
  res.json({ status: 'success' });
});

