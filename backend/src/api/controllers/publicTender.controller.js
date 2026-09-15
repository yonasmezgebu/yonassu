const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const TenderModel = require('../../models/Tender.model');
const BidModel = require('../../models/Bid.model');

// ─── Helper: attach items to tenders ───────────────────────────────────────
const attachItems = async (tenders) => {
  for (const tender of tenders) {
    tender.items = await db('public_tender_items').where({ public_tender_id: tender.id });
    const bidsCount = await db('public_bids').where({ public_tender_id: tender.id }).count('id as count').first();
    tender.bids_count = bidsCount?.count || 0;
  }
  return tenders;
};

// ─── CREATE TENDER ──────────────────────────────────────────────────────────
exports.createTender = catchAsync(async (req, res) => {
  const tender = TenderModel.fromRequest(req.body);
  tender.createdBy = req.user.id;
  tender.status = 'published'; // Directly published - no CEO approval needed to post

  const val = tender.validate();
  if (!val.isValid) throw AppError.badRequest(val.errors.join(', '));

  // Auto-generate tender number if not provided
  const lastTender = await db('public_tenders').orderBy('id', 'desc').first();
  const nextSeq = (lastTender?.id || 0) + 1;
  const tenderNumber = tender.tenderNumber || TenderModel.generateNumber(nextSeq);

  const [id] = await db('public_tenders').insert({
    tender_number: tenderNumber,
    title: tender.title,
    category: tender.category || null,
    description: tender.description,
    terms_conditions: tender.termsConditions || null,
    opening_date: tender.openingDate || new Date(),
    closing_date: tender.closingDate || null,
    contact_phone1: tender.contactPhone1 || null,
    contact_phone2: tender.contactPhone2 || null,
    contact_email: tender.contactEmail || null,
    status: tender.status,
    created_by: tender.createdBy,
  });

  if (tender.items && tender.items.length > 0) {
    const items = tender.items.map(item => ({
      public_tender_id: id,
      object_type: item.objectType,
      unit: item.unit || '',
      quantity: item.quantity
    }));
    await db('public_tender_items').insert(items);
  }

  res.status(201).json({ status: 'success', data: { id, tenderNumber, ...tender } });
});

// ─── EDIT TENDER (Purchase / Admin) ─────────────────────────────────────────
// Lets a published tender be edited on the Purchase side (e.g. to insert or
// update the Terms & Conditions that suppliers accept on the public page).
exports.updateTender = catchAsync(async (req, res) => {
  const { id } = req.params;

  const tender = await db('public_tenders').where({ id }).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (!['draft', 'published'].includes(tender.status)) {
    throw AppError.badRequest('Only draft or published tenders can be edited');
  }

  const updates = {};
  if (req.body.title != null) updates.title = req.body.title;
  if (req.body.category != null) updates.category = req.body.category || null;
  if (req.body.description != null) updates.description = req.body.description;
  if (req.body.termsConditions != null) updates.terms_conditions = req.body.termsConditions || null;
  if (req.body.openingDate != null) updates.opening_date = req.body.openingDate || null;
  if (req.body.closingDate != null) updates.closing_date = req.body.closingDate || null;
  updates.updated_at = db.fn.now();

  await db('public_tenders').where({ id }).update(updates);
  const updated = await db('public_tenders').where({ id }).first();

  res.json({ status: 'success', message: 'Tender updated successfully', data: updated });
});

// ─── APPROVE TENDER (CEO) ───────────────────────────────────────────────────
exports.approveTender = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { bidIds } = req.body; // Array of selected bid IDs
  
  const tender = await db('public_tenders').where({ id }).first();
  if (!tender) throw AppError.notFound('Tender not found');

  // Mark selected bids as winner, others as rejected
  if (Array.isArray(bidIds) && bidIds.length > 0) {
    await db('public_bids').where({ public_tender_id: id }).whereIn('id', bidIds).update({ bid_status: 'winner' });
    await db('public_bids').where({ public_tender_id: id }).whereNotIn('id', bidIds).update({ bid_status: 'rejected' });
  }

  await db('public_tenders').where({ id }).update({
    status: 'awarded',
    approved_by: req.user.id,
    updated_at: db.fn.now()
  });

  // Notify Purchase Manager that CEO has made a decision
  try {
    const io = req.app?.get('io');
    if (io) {
      io.emit('pharmacy-transfer', {
        title: '✅ Tender Awarded by CEO',
        message: `CEO has approved and awarded bids for Tender ${tender.tender_number}.`,
        type: 'success',
        link: `/purchase/smart-tenders?viewTender=${id}`
      });
    }
  } catch (e) {
    console.error('Failed to notify about tender award', e);
  }

  res.json({ status: 'success', message: 'Tender awarded and completed' });
});

// ─── CLOSE TENDER ───────────────────────────────────────────────────────────
exports.closeTender = catchAsync(async (req, res) => {
  const { id } = req.params;
  const tender = await db('public_tenders').where({ id }).first();
  if (!tender) throw AppError.notFound('Tender not found');

  await db('public_tenders').where({ id }).update({
    status: 'closed',
    updated_at: db.fn.now()
  });

  res.json({ status: 'success', message: 'Tender closed successfully' });
});

// ─── SUBMIT EVALUATION TO CEO ───────────────────────────────────────────────
exports.submitEvaluationToCEO = catchAsync(async (req, res) => {
  const { id } = req.params;
  const tender = await db('public_tenders').where({ id }).first();
  if (!tender) throw AppError.notFound('Tender not found');

  await db('public_tenders').where({ id }).update({
    status: 'awaiting_ceo_approval',
    updated_at: db.fn.now()
  });

  // Notify CEO
  try {
    const io = req.app?.get('io');
    if (io) {
      io.emit('pharmacy-transfer', {
        title: '📊 Tender Bids Ready',
        message: `Tender ${tender.tender_number} bids evaluated. Ready for CEO award.`,
        type: 'info',
        link: '/ceo/tenders'
      });
    }
  } catch (e) {
    console.error('Failed to notify CEO', e);
  }

  res.json({ status: 'success', message: 'Evaluation submitted to CEO' });
});

// ─── RECOMMEND SUPPLIER ─────────────────────────────────────────────────────
exports.recommendSupplier = catchAsync(async (req, res) => {
  const { bidId } = req.params;
  const { reason } = req.body;

  const bid = await db('public_bids').where({ id: bidId }).first();
  if (!bid) throw AppError.notFound('Bid not found');

  // Reset all other bids for this tender to 'pending'
  await db('public_bids').where({ public_tender_id: bid.public_tender_id }).update({ bid_status: 'pending' });

  // Mark this bid as recommended
  await db('public_bids').where({ id: bidId }).update({
    bid_status: 'recommended',
    recommendation_reason: reason || 'Best value for money'
  });

  res.json({ status: 'success', message: 'Supplier recommended successfully' });
});

// ─── GET PUBLIC TENDERS (for public page) ──────────────────────────────────
exports.getPublicTenders = catchAsync(async (req, res) => {
  const tenders = await db('public_tenders')
    .where({ status: 'published' })
    .orderBy('created_at', 'desc');

  await attachItems(tenders);
  res.json({ status: 'success', data: tenders });
});

// ─── GET TENDER DETAILS ─────────────────────────────────────────────────────
exports.getTenderDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const tender = await db('public_tenders').where({ id }).first();
  if (!tender) throw AppError.notFound('Tender not found');

  tender.items = await db('public_tender_items').where({ public_tender_id: tender.id });
  res.json({ status: 'success', data: tender });
});

// ─── GET ALL INTERNAL TENDERS ───────────────────────────────────────────────
exports.getAllInternalTenders = catchAsync(async (req, res) => {
  const tenders = await db('public_tenders').orderBy('created_at', 'desc');
  await attachItems(tenders);
  res.json({ status: 'success', data: tenders });
});

// ─── GET RECENT NEW BIDS (For Purchase Manager) ─────────────────────────────
exports.getRecentBids = catchAsync(async (req, res) => {
  const recentBids = await db('public_bids').where('bid_status', 'pending');
  res.json({ status: 'success', data: recentBids });
});

// ─── SUBMIT BID ─────────────────────────────────────────────────────────────
exports.submitBid = catchAsync(async (req, res) => {
  const { id } = req.params; // tender id

  // Confirm tender exists and is published
  const tender = await db('public_tenders').where({ id }).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'published') throw AppError.badRequest('This tender is no longer accepting bids');

  const bid = BidModel.fromRequest({ ...req.body, tenderId: id });

  const val = bid.validate();
  if (!val.isValid) throw AppError.badRequest(val.errors.join(', '));

  // ── DUPLICATE CHECK: one bid per email per tender ─────────────────────────
  const existing = await db('public_bids')
    .where({ public_tender_id: id, email: bid.email })
    .first();

  if (existing) {
    return res.status(409).json({
      status: 'duplicate',
      message: 'You have already submitted a bid for this tender. Please use the update option in your Customer Portal to modify your existing bid.',
      bidId: existing.id,
    });
  }

  const [bidId] = await db('public_bids').insert({
    public_tender_id: id,
    competitor_name: bid.competitorName,
    email: bid.email,
    phone: bid.phone,
    delivery_time: bid.deliveryTime,
    payment_terms: bid.paymentTerms,
    payment_method: bid.paymentMethod,
    terms_conditions: bid.termsConditions || null,
    digital_signature_text: bid.digitalSignatureText,
    hand_signature_path: bid.handSignaturePath,
    bid_status: 'pending'
  });

  if (bid.items && bid.items.length > 0) {
    const items = bid.items.map(item => {
      const priceB = parseInt(item.priceBirr || 0);
      const priceC = parseInt(item.priceCent || 0);
      return {
        public_bid_id: bidId,
        public_tender_item_id: item.tenderItemId,
        price_birr: priceB,
        price_cent: priceC,
        total_birr: parseInt(item.totalBirr || priceB),
        total_cent: parseInt(item.totalCent || priceC),
        checkup: item.checkup || ''
      };
    });
    await db('public_bid_items').insert(items);
  }

  // Notify CEO and Procurement that a new bid was received
  try {
    const io = req.app?.get('io');
    if (io) {
      io.emit('pharmacy-transfer', {
        title: '🔔 New Bid Submitted',
        message: `A new bid was submitted by ${bid.competitorName} for Tender ${tender.tender_number}.`,
        type: 'info',
        link: '/ceo/tenders?tab=Open'
      });
    }
  } catch (e) {
    console.error('Failed to notify about new bid', e);
  }

  res.status(201).json({ status: 'success', message: 'Bid submitted successfully', bidId });
});

// ─── UPDATE MY PUBLIC BID ────────────────────────────────────────────────────
exports.updateMyPublicBid = catchAsync(async (req, res) => {
  const { bidId } = req.params;
  const userEmail = req.user.email;

  const existing = await db('public_bids').where({ id: bidId, email: userEmail }).first();
  if (!existing) throw AppError.notFound('Bid not found or not owned by you');
  if (existing.bid_status !== 'pending') {
    throw AppError.badRequest('Only pending bids can be updated');
  }

  // Update header fields
  await db('public_bids').where({ id: bidId }).update({
    competitor_name: req.body.competitorName || existing.competitor_name,
    phone: req.body.phone || existing.phone,
    delivery_time: req.body.deliveryTime || existing.delivery_time,
    payment_terms: req.body.paymentTerms || existing.payment_terms,
    payment_method: req.body.paymentMethod || existing.payment_method,
    terms_conditions: req.body.termsConditions || existing.terms_conditions,
    hand_signature_path: req.body.handSignaturePath || existing.hand_signature_path,
    updated_at: db.fn.now(),
  });

  // Update item prices if provided
  if (req.body.items && req.body.items.length > 0) {
    for (const item of req.body.items) {
      const priceB = parseInt(item.priceBirr || 0);
      const priceC = parseInt(item.priceCent || 0);
      await db('public_bid_items')
        .where({ public_bid_id: bidId, public_tender_item_id: item.tenderItemId })
        .update({
          price_birr: priceB,
          price_cent: priceC,
          total_birr: parseInt(item.totalBirr || priceB),
          total_cent: parseInt(item.totalCent || priceC),
          checkup: item.checkup || '',
        });
    }
  }

  const updated = await db('public_bids').where({ id: bidId }).first();
  updated.items = await db('public_bid_items').where({ public_bid_id: bidId });

  res.json({ status: 'success', message: 'Bid updated successfully', data: updated });
});


// ─── GET MY BID ON A TENDER (authenticated customer) ────────────────────────
exports.getMyPublicBid = catchAsync(async (req, res) => {
  const tenderId = req.params.id;
  const { email } = req.user;
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'User email is required' });
  }

  const bid = await db('public_bids')
    .where({ public_tender_id: tenderId, email })
    .where(function() {
      this.where('is_deleted_by_customer', false).orWhereNull('is_deleted_by_customer');
    })
    .first();

  if (!bid) {
    return res.status(200).json({ status: 'success', data: null });
  }

  bid.items = await db('public_bid_items').where({ public_bid_id: bid.id });
  res.json({ status: 'success', data: bid });
});

// ─── UPDATE MY BID ON A TENDER (authenticated customer) ─────────────────────
exports.updatePublicBid = catchAsync(async (req, res) => {
  const tenderId = req.params.id;
  const { email } = req.user;
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'User email is required' });
  }

  const existing = await db('public_bids')
    .where({ public_tender_id: tenderId, email })
    .where(function() {
      this.where('is_deleted_by_customer', false).orWhereNull('is_deleted_by_customer');
    })
    .first();
  if (!existing) throw AppError.notFound('Bid not found or not owned by you');
  if (existing.bid_status !== 'pending') {
    throw AppError.badRequest('Only pending bids can be updated');
  }

  // Update header fields
  await db('public_bids').where({ id: existing.id }).update({
    competitor_name: req.body.competitorName || existing.competitor_name,
    phone: req.body.phone || existing.phone,
    delivery_time: req.body.deliveryTime || existing.delivery_time,
    payment_terms: req.body.paymentTerms || existing.payment_terms,
    payment_method: req.body.paymentMethod || existing.payment_method,
    terms_conditions: req.body.termsConditions || existing.terms_conditions,
    hand_signature_path: req.body.handSignaturePath || existing.hand_signature_path,
    updated_at: db.fn.now(),
  });

  // Update item prices if provided
  if (req.body.items && req.body.items.length > 0) {
    for (const item of req.body.items) {
      const priceB = parseInt(item.priceBirr || 0);
      const priceC = parseInt(item.priceCent || 0);
      await db('public_bid_items')
        .where({ public_bid_id: existing.id, public_tender_item_id: item.tenderItemId })
        .update({
          price_birr: priceB,
          price_cent: priceC,
          total_birr: parseInt(item.totalBirr || priceB),
          total_cent: parseInt(item.totalCent || priceC),
          checkup: item.checkup || '',
        });
    }
  }

  const updated = await db('public_bids').where({ id: existing.id }).first();
  updated.items = await db('public_bid_items').where({ public_bid_id: existing.id });

  res.json({ status: 'success', message: 'Bid updated successfully', data: updated });
});


// ─── GET BIDS FOR TENDER (with analytics) ──────────────────────────────────
exports.getBidsForTender = catchAsync(async (req, res) => {
  const { id } = req.params;

  const tenderItems = await db('public_tender_items').where({ public_tender_id: id });
  const results = [];

  for (const tItem of tenderItems) {
    const bidItems = await db('public_bid_items')
      .join('public_bids', 'public_bids.id', 'public_bid_items.public_bid_id')
      .where({ 'public_bid_items.public_tender_item_id': tItem.id })
      .select(
        'public_bid_items.*',
        'public_bids.id as bid_id',
        'public_bids.competitor_name',
        'public_bids.email',
        'public_bids.phone',
        'public_bids.delivery_time',
        'public_bids.payment_terms',
        'public_bids.payment_method',
        'public_bids.bid_status',
        'public_bids.recommendation_reason',
        'public_bids.created_at as bid_submitted_at'
      )
      .orderBy('public_bid_items.price_birr', 'asc')
      .orderBy('public_bid_items.price_cent', 'asc');

    // Analytics: lowest, highest, average, variance
    const analytics = { lowest: null, highest: null, average: null, variance: null };
    if (bidItems.length > 0) {
      const totals = bidItems.map(b => (b.price_birr * 100) + b.price_cent);
      analytics.lowest = Math.min(...totals) / 100;
      analytics.highest = Math.max(...totals) / 100;
      analytics.average = (totals.reduce((a, b) => a + b, 0) / totals.length) / 100;
      analytics.variance = analytics.highest - analytics.lowest;
    }

    results.push({ tenderItem: tItem, bids: bidItems, analytics });
  }

  res.json({ status: 'success', data: results });
});

// ─── GET CUSTOMER BIDS (public tenders only) ────────────────────────────────
exports.getCustomerBids = catchAsync(async (req, res) => {
  const { email } = req.user;
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'User email is required' });
  }

  const bids = await db('public_bids')
    .join('public_tenders', 'public_bids.public_tender_id', 'public_tenders.id')
    .where('public_bids.email', email)
    .where(function() {
      this.where('public_bids.is_deleted_by_customer', false).orWhereNull('public_bids.is_deleted_by_customer');
    })
    .select(
      'public_bids.*',
      'public_tenders.title as tender_title',
      'public_tenders.tender_number',
      'public_tenders.category as tender_category',
    )
    .orderBy('public_bids.created_at', 'desc');

  for (const bid of bids) {
    bid.items = await db('public_bid_items')
      .join('public_tender_items', 'public_bid_items.public_tender_item_id', 'public_tender_items.id')
      .where({ public_bid_id: bid.id })
      .select('public_bid_items.*', 'public_tender_items.object_type', 'public_tender_items.unit', 'public_tender_items.quantity as tender_quantity');
  }

  res.json({ status: 'success', data: bids });
});

