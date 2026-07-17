const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// ─── GET PROCUREMENT SETTINGS (public) ─────────────────────────────────────
exports.getSettings = catchAsync(async (req, res) => {
  const row = await db('procurement_settings').first();
  res.json({
    status: 'success',
    data: row || { contact_phone1: '', contact_phone2: '', contact_email: '' }
  });
});

// ─── UPDATE PROCUREMENT SETTINGS (Purchase / Admin only) ───────────────────
exports.updateSettings = catchAsync(async (req, res) => {
  const { contactPhone1, contactPhone2, contactEmail } = req.body;

  const existing = await db('procurement_settings').first();

  if (existing) {
    await db('procurement_settings').where({ id: existing.id }).update({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
      updated_at: db.fn.now()
    });
  } else {
    await db('procurement_settings').insert({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
    });
  }

  const updated = await db('procurement_settings').first();
  res.json({ status: 'success', data: updated });
});

// ─── SUBMIT MESSAGE FROM PUBLIC (no auth) ──────────────────────────────────
exports.submitMessage = catchAsync(async (req, res) => {
  const { senderName, senderEmail, senderPhone, message } = req.body;
  if (!senderName || !senderEmail || !message) {
    throw AppError.badRequest('Name, email, and message are required');
  }
  const [id] = await db('procurement_messages').insert({
    sender_name: senderName,
    sender_email: senderEmail,
    sender_phone: senderPhone || null,
    message,
    is_read: false,
  });
  res.status(201).json({ status: 'success', message: 'Message received', id });
});

// ─── GET ALL MESSAGES (Purchase / Admin) ───────────────────────────────────
exports.getMessages = catchAsync(async (req, res) => {
  const messages = await db('procurement_messages').orderBy('created_at', 'desc');
  res.json({ status: 'success', data: messages });
});

// ─── GET UNREAD COUNT (Purchase / Admin) ───────────────────────────────────
exports.getUnreadCount = catchAsync(async (req, res) => {
  const row = await db('procurement_messages').where({ is_read: false }).count('id as count').first();
  res.json({ status: 'success', count: Number(row?.count || 0) });
});

// ─── MARK MESSAGE AS READ ──────────────────────────────────────────────────
exports.markRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('procurement_messages').where({ id }).update({ is_read: true, updated_at: db.fn.now() });
  res.json({ status: 'success' });
});

// ─── MARK ALL MESSAGES AS READ ─────────────────────────────────────────────
exports.markAllRead = catchAsync(async (req, res) => {
  await db('procurement_messages').where({ is_read: false }).update({ is_read: true, updated_at: db.fn.now() });
  res.json({ status: 'success' });
});

