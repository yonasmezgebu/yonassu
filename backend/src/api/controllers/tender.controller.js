const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const notificationRepository = require('../../repositories/notification.repository');
const { log } = require('../../services/salesAudit.service');

const genRef = async () => {
  const year = new Date().getFullYear();
  const last = await db('tenders').whereRaw('YEAR(created_at) = ?', [year]).orderBy('id', 'desc').first();
  const seq = last && last.reference_number ? parseInt(last.reference_number.split('-')[2]) + 1 : 1;
  return `TND-${year}-${String(seq).padStart(3, '0')}`;
};

exports.listPublic = catchAsync(async (req, res) => {
  const { status, category, search } = req.query;
  let q = db('tenders').whereIn('status', ['open', 'closed', 'awarded', 'cancelled']).where('is_hidden', false);
  if (status) q = q.where('status', status);
  if (category) q = q.where('category', category);
  if (search) q = q.where(function() { this.where('title', 'like', `%${search}%`).orWhere('description', 'like', `%${search}%`); });
  const tenders = await q.orderBy('created_at', 'desc').limit(50);
  res.json({ status: 'success', data: tenders });
});

exports.getPublic = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).whereIn('status', ['open', 'closed', 'awarded', 'cancelled']).first();
  if (!tender) throw AppError.notFound('Tender not found');
  res.json({ status: 'success', data: tender });
});

exports.listInternal = catchAsync(async (req, res) => {
  const tenders = await db('tenders').orderBy('created_at', 'desc').limit(100);
  res.json({ status: 'success', data: tenders });
});

exports.getInternal = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  res.json({ status: 'success', data: tender });
});

exports.create = catchAsync(async (req, res) => {
  const { title, description, category, item_name, quantity, starting_bid_price, deadline, terms_conditions, attachments, items } = req.body;
  
  if (!title || !description || !deadline || !terms_conditions) {
    throw AppError.badRequest('Title, description, deadline, and terms are required');
  }

  // If items array is not provided, enforce single-product fields
  if (!items && (quantity === undefined || starting_bid_price === undefined)) {
    throw AppError.badRequest('Quantity and starting price are required for single-item tenders');
  }

  const files = req.files ? req.files.map(f => f.filename) : [];
  const ref = await genRef();
  const [id] = await db('tenders').insert({
    reference_number: ref, title, description, category: category || null,
    item_name: item_name || null, 
    quantity: quantity || 1, 
    starting_bid_price: starting_bid_price || 0,
    deadline: new Date(deadline), terms_conditions,
    status: 'open', created_by: req.user.id,
    attachments: files.length ? JSON.stringify(files) : null,
    items: items ? items : null
  });
  const tender = await db('tenders').where('id', id).first();
  log(req, 'Tender Created', `Tender ${ref} — ${title}`, null, tender);
  res.status(201).json({ status: 'success', data: tender });
});

exports.update = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status === 'awarded') {
    throw AppError.badRequest('Cannot edit an awarded tender');
  }
  const { title, description, category, item_name, quantity, starting_bid_price, deadline, terms_conditions, items } = req.body;
  const updates = {};
  if (title !== undefined && title !== '') updates.title = title;
  if (description !== undefined && description !== '') updates.description = description;
  if (category !== undefined) updates.category = category || null;
  if (item_name !== undefined) updates.item_name = item_name || null;
  if (quantity !== undefined && quantity !== '') updates.quantity = quantity;
  if (starting_bid_price !== undefined && starting_bid_price !== '') updates.starting_bid_price = starting_bid_price;
  if (deadline !== undefined && deadline !== '') updates.deadline = new Date(deadline);
  if (terms_conditions !== undefined && terms_conditions !== '') updates.terms_conditions = terms_conditions;
  if (items !== undefined) updates.items = items;
  // Handle file attachments if provided
  if (req.files && req.files.length > 0) {
    const newFiles = req.files.map(f => f.filename);
    const replace = req.body.replace_attachments === 'true';
    if (replace) {
      // Delete old files from disk
      const path = require('path');
      const fs = require('fs');
      const oldFiles = tender.attachments ? JSON.parse(tender.attachments) : [];
      for (const oldFile of oldFiles) {
        const fullPath = path.join(__dirname, '../../../../uploads/tenders', oldFile);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      updates.attachments = JSON.stringify(newFiles);
    } else {
      const existingFiles = tender.attachments ? JSON.parse(tender.attachments) : [];
      updates.attachments = JSON.stringify([...existingFiles, ...newFiles]);
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.json({ status: 'success', data: tender });
  }

  // If the tender was closed or cancelled, automatically reopen it if the deadline is in the future
  const newDeadline = updates.deadline || tender.deadline;
  if (newDeadline && new Date(newDeadline).getTime() > Date.now()) {
    if (['closed', 'cancelled'].includes(tender.status)) {
      updates.status = 'open';
      updates.cancellation_reason = null;
    }
    // Always clear the notification flag if the deadline is in the future
    updates.deadline_notified = false;
  }

  updates.updated_at = db.fn.now();
  await db('tenders').where('id', req.params.id).update(updates);
  const updated = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Updated', `Tender ${tender.reference_number} — ${tender.title}`, tender, updated);
  res.json({ status: 'success', data: updated });
});

exports.publish = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'draft') throw AppError.badRequest('Only draft tenders can be published');
  const value = parseFloat(tender.starting_bid_price) * parseInt(tender.quantity);
  let newStatus = 'open';
  if (value > 500000) newStatus = 'pending_approval';
  else if (value > 100000) newStatus = 'pending_approval';
  await db('tenders').where('id', req.params.id).update({ status: newStatus, updated_at: db.fn.now() });
  const updated = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Published', `Tender ${tender.reference_number} — ${tender.title}`, tender, updated);
  if (newStatus === 'pending_approval') {
    await notificationRepository.create({ roleTarget: 'Admin', title: 'Tender Approval Needed', message: `Tender ${tender.reference_number} — ${tender.title} requires approval (value: ETB ${value.toLocaleString()})` });
    await notificationRepository.create({ roleTarget: 'CEO', title: 'Tender Approval Needed', message: `Tender ${tender.reference_number} — ${tender.title} requires approval (value: ETB ${value.toLocaleString()})` });
  } else {
    await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Published', message: `Tender ${tender.reference_number} — ${tender.title} is now open for bids` });
  }
  res.json({ status: 'success', data: updated });
});

exports.approve = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'pending_approval') throw AppError.badRequest('Tender is not pending approval');
  await db('tenders').where('id', req.params.id).update({ status: 'open', approved_by: req.user.id, updated_at: db.fn.now() });
  const updated = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Approved', `Tender ${tender.reference_number} — ${tender.title}`, tender, updated);
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Approved', message: `Tender ${tender.reference_number} — ${tender.title} has been approved and is now open` });
  res.json({ status: 'success', data: updated });
});

exports.close = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  const closeable = ['open', 'draft', 'pending_approval'];
  if (!closeable.includes(tender.status)) throw AppError.badRequest('Tender cannot be closed from its current status');
  await db('tenders').where('id', req.params.id).update({ status: 'closed', updated_at: db.fn.now() });
  const closed = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Closed', `Tender ${tender.reference_number} — ${tender.title}`, tender, closed);
  res.json({ status: 'success', message: 'Tender closed' });
});

exports.extend = catchAsync(async (req, res) => {
  const { deadline } = req.body;
  if (!deadline) throw AppError.badRequest('New deadline is required');
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (['awarded'].includes(tender.status)) throw AppError.badRequest('Cannot extend an awarded tender');
  
  const updates = { deadline: new Date(deadline), updated_at: db.fn.now() };
  if (new Date(deadline).getTime() > Date.now()) {
    updates.deadline_notified = false;
    if (['closed', 'cancelled'].includes(tender.status)) {
      updates.status = 'open';
      updates.cancellation_reason = null;
    }
  }
  
  await db('tenders').where('id', req.params.id).update(updates);
  const extended = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Deadline Extended', `Tender ${tender.reference_number} — ${tender.title}`, tender, extended);
  res.json({ status: 'success', message: 'Deadline extended' });
});

exports.cancel = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw AppError.badRequest('Cancellation reason is required');
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (['awarded', 'cancelled'].includes(tender.status)) throw AppError.badRequest('Cannot cancel an awarded or already cancelled tender');
  const bidders = await db('bids').where('tender_id', tender.id).whereNot('status', 'disqualified').select('customer_id');
  await db('tenders').where('id', req.params.id).update({ status: 'cancelled', cancellation_reason: reason, updated_at: db.fn.now() });
  for (const b of bidders) {
    await notificationRepository.create({ userId: b.customer_id, title: 'Tender Cancelled', message: `Tender ${tender.reference_number} — ${tender.title} has been cancelled. Reason: ${reason}` });
  }
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Cancelled', message: `Tender ${tender.reference_number} — ${tender.title} was cancelled: ${reason}` });
  const cancelled = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Cancelled', `Tender ${tender.reference_number} — ${tender.title}`, tender, cancelled);
  res.json({ status: 'success', message: 'Tender cancelled' });
});

exports.toggleHidden = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  const newValue = !tender.is_hidden;
  await db('tenders').where('id', req.params.id).update({ is_hidden: newValue, updated_at: db.fn.now() });
  const toggled = await db('tenders').where('id', req.params.id).first();
  log(req, 'Tender Visibility Toggled', `Tender ${tender.reference_number} — ${tender.title}`, tender, toggled);
  res.json({ status: 'success', is_hidden: newValue, message: newValue ? 'Tender hidden from public' : 'Tender visible to public' });
});

exports.delete = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  
  await db('bids').where('tender_id', req.params.id).del();
  await db('tenders').where('id', req.params.id).del();
  log(req, 'Tender Deleted', `Tender ${tender.reference_number} — ${tender.title}`, tender, null);
  res.json({ status: 'success', message: 'Tender deleted' });
});
