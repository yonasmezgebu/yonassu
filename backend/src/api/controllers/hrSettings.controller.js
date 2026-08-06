const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// ─── GET PRINTING SETTINGS (public) ─────────────────────────────────────
exports.getSettings = catchAsync(async (req, res) => {
  const row = await db('hr_settings').first();
  res.json({
    status: 'success',
    data: row || { contact_phone1: '', contact_phone2: '', contact_email: '' }
  });
});

// ─── UPDATE PRINTING SETTINGS (Manager / Admin only) ───────────────────
exports.updateSettings = catchAsync(async (req, res) => {
  const { contactPhone1, contactPhone2, contactEmail } = req.body;

  const existing = await db('hr_settings').first();

  if (existing) {
    await db('hr_settings').where({ id: existing.id }).update({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
      updated_at: db.fn.now()
    });
  } else {
    await db('hr_settings').insert({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
    });
  }

  const updated = await db('hr_settings').first();
  res.json({ status: 'success', data: updated });
});

// ─── SUBMIT MESSAGE FROM PUBLIC (no auth) ──────────────────────────────────
exports.submitMessage = catchAsync(async (req, res) => {
  const { senderName, senderEmail, senderPhone, message } = req.body;
  if (!senderName || !senderEmail || !message) {
    throw AppError.badRequest('Name, email, and message are required');
  }
  const [id] = await db('hr_messages').insert({
    name: senderName,
    email: senderEmail,
    phone: senderPhone || null,
    message,
    status: 'unread',
  });
  res.status(201).json({ status: 'success', message: 'Message received', id });
});

// ─── GET ALL MESSAGES (Manager / Admin) ───────────────────────────────────
exports.getMessages = catchAsync(async (req, res) => {
  const messages = await db('hr_messages').orderBy('created_at', 'desc');
  // Map fields for frontend consistency (if needed)
  const mapped = messages.map(m => ({
    ...m,
    sender_name: m.name,
    sender_email: m.email,
    sender_phone: m.phone,
    is_read: m.status !== 'unread'
  }));
  res.json({ status: 'success', data: mapped });
});

// ─── GET UNREAD COUNT (Manager / Admin) ───────────────────────────────────
exports.getUnreadCount = catchAsync(async (req, res) => {
  const row = await db('hr_messages').where({ status: 'unread' }).count('id as count').first();
  res.json({ status: 'success', count: Number(row?.count || 0) });
});

// ─── MARK MESSAGE AS READ ──────────────────────────────────────────────────
exports.markRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('hr_messages').where({ id }).update({ status: 'read', updated_at: db.fn.now() });
  res.json({ status: 'success' });
});

// ─── MARK ALL MESSAGES AS READ ─────────────────────────────────────────────
exports.markAllRead = catchAsync(async (req, res) => {
  await db('hr_messages').where({ status: 'unread' }).update({ status: 'read', updated_at: db.fn.now() });
  res.json({ status: 'success' });
});
