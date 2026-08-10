const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { log } = require('../../services/salesAudit.service');

// ─── GET SALES SETTINGS (public) ─────────────────────────────────────
exports.getSettings = catchAsync(async (req, res) => {
  const row = await db('sales_settings').first();
  res.json({
    status: 'success',
    data: row || { contact_phone1: '', contact_phone2: '', contact_email: '' }
  });
});

// ─── UPDATE SALES SETTINGS (Sales / Admin only) ───────────────────
exports.updateSettings = catchAsync(async (req, res) => {
  const { contactPhone1, contactPhone2, contactEmail } = req.body;

  const existing = await db('sales_settings').first();

  if (existing) {
    await db('sales_settings').where({ id: existing.id }).update({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
      updated_at: db.fn.now()
    });
  } else {
    await db('sales_settings').insert({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
    });
  }

  const updated = await db('sales_settings').first();
  log(req, 'Contact Settings Updated', updated?.id || 'sales', null, { contact_phone1: updated?.contact_phone1, contact_phone2: updated?.contact_phone2, contact_email: updated?.contact_email });
  res.json({ status: 'success', data: updated });
});

// ─── SUBMIT MESSAGE FROM PUBLIC (no auth) ──────────────────────────────────
exports.submitMessage = catchAsync(async (req, res) => {
  const { senderName, senderEmail, senderPhone, message } = req.body;
  if (!senderName || !senderEmail || !message) {
    throw AppError.badRequest('Name, email, and message are required');
  }
  const [id] = await db('sales_messages').insert({
    sender_name: senderName,
    sender_email: senderEmail,
    sender_phone: senderPhone || null,
    message,
    is_read: false,
  });
  res.status(201).json({ status: 'success', message: 'Message received', id });
});

// ─── GET ALL MESSAGES (Sales / Admin) ───────────────────────────────────
exports.getMessages = catchAsync(async (req, res) => {
  const messages = await db('sales_messages').orderBy('created_at', 'desc');
  res.json({ status: 'success', data: messages });
});

// ─── GET UNREAD COUNT (Sales / Admin) ───────────────────────────────────
exports.getUnreadCount = catchAsync(async (req, res) => {
  const row = await db('sales_messages').where({ is_read: false }).count('id as count').first();
  res.json({ status: 'success', count: Number(row?.count || 0) });
});

// ─── MARK MESSAGE AS READ ──────────────────────────────────────────────────
exports.markRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('sales_messages').where({ id }).update({ is_read: true, updated_at: db.fn.now() });
  res.json({ status: 'success' });
});

// ─── MARK ALL MESSAGES AS READ ─────────────────────────────────────────────
exports.markAllRead = catchAsync(async (req, res) => {
  await db('sales_messages').where({ is_read: false }).update({ is_read: true, updated_at: db.fn.now() });
  res.json({ status: 'success' });
});

// ─── TOGGLE MESSAGE READ STATUS ────────────────────────────────────────────
exports.toggleReadStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body;
  const before = await db('sales_messages').where('id', id).first();
  await db('sales_messages').where({ id }).update({ is_read: is_read ? 1 : 0, updated_at: db.fn.now() });
  log(req, 'Message Read Status Toggled', id, before ? { is_read: !!before.is_read } : null, { is_read: !!is_read });
  res.json({ status: 'success' });
});

// ─── DELETE MESSAGE ─────────────────────────────────────────────────────────
exports.deleteMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('sales_messages').where({ id }).delete();
  log(req, 'Message Deleted', id, null, { messageId: id });
  res.json({ status: 'success' });
});
