const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const centralAudit = require('../../services/centralAudit.service');

/* Non-blocking audit helper — mirrors printingAssets.controller.js */
const storeLog = (req, action, recordIdentifier, previousValue, newValue) => {
  const u = req.user || {};
  centralAudit.createLog({
    userId:           u.id || null,
    userName:         u.fullName || u.full_name || u.username || 'System',
    role:             Array.isArray(u.roles) ? u.roles.join(', ') : (u.role_names || u.role || 'Unknown'),
    department:       u.departmentName || u.department_name || 'Printing',
    module:           'Printing',
    action,
    recordIdentifier: String(recordIdentifier || ''),
    previousValue,
    newValue,
    ipAddress:        req.ip,
  }).catch(() => {});
  if (req.res) req.res.locals.__centralAudited = true;
};

// ─── GET PRINTING SETTINGS (public) ─────────────────────────────────────
exports.getSettings = catchAsync(async (req, res) => {
  const row = await db('printing_settings').first();
  res.json({
    status: 'success',
    data: row || { contact_phone1: '', contact_phone2: '', contact_email: '' }
  });
});

// ─── UPDATE PRINTING SETTINGS (Manager / Admin only) ───────────────────
exports.updateSettings = catchAsync(async (req, res) => {
  const { contactPhone1, contactPhone2, contactEmail } = req.body;

  const existing = await db('printing_settings').first();
  const before = existing
    ? { contact_phone1: existing.contact_phone1, contact_phone2: existing.contact_phone2, contact_email: existing.contact_email }
    : null;

  if (existing) {
    await db('printing_settings').where({ id: existing.id }).update({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
      updated_at: db.fn.now()
    });
  } else {
    await db('printing_settings').insert({
      contact_phone1: contactPhone1 || null,
      contact_phone2: contactPhone2 || null,
      contact_email: contactEmail || null,
    });
  }

  const updated = await db('printing_settings').first();
  storeLog(req, 'PRINTING_SETTINGS_UPDATED', updated?.id || 1, before, {
    contact_phone1: updated?.contact_phone1 || null,
    contact_phone2: updated?.contact_phone2 || null,
    contact_email: updated?.contact_email || null
  });
  res.json({ status: 'success', data: updated });
});

// ─── SUBMIT MESSAGE FROM PUBLIC (no auth) ──────────────────────────────────
exports.submitMessage = catchAsync(async (req, res) => {
  const { senderName, senderEmail, senderPhone, message } = req.body;
  if (!senderName || !senderEmail || !message) {
    throw AppError.badRequest('Name, email, and message are required');
  }
  const [id] = await db('printing_messages').insert({
    name: senderName,
    email: senderEmail,
    phone: senderPhone || '',
    message,
    status: 'unread',
  });
  storeLog(req, 'PRINTING_MESSAGE_RECEIVED', id, null, {
    name: senderName,
    email: senderEmail,
    phone: senderPhone || '',
    message
  });
  res.status(201).json({ status: 'success', message: 'Message received', id });
});

// ─── GET ALL MESSAGES (Manager / Admin) ───────────────────────────────────
exports.getMessages = catchAsync(async (req, res) => {
  const messages = await db('printing_messages').orderBy('created_at', 'desc');
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
  const row = await db('printing_messages').where({ status: 'unread' }).count('id as count').first();
  res.json({ status: 'success', count: Number(row?.count || 0) });
});

// ─── MARK MESSAGE AS READ ──────────────────────────────────────────────────
exports.markRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  await db('printing_messages').where({ id }).update({ status: 'read', updated_at: db.fn.now() });
  storeLog(req, 'PRINTING_MESSAGE_READ', id, null, { status: 'read' });
  res.json({ status: 'success' });
});

// ─── MARK ALL MESSAGES AS READ ─────────────────────────────────────────────
exports.markAllRead = catchAsync(async (req, res) => {
  const unread = await db('printing_messages').where({ status: 'unread' }).count('id as c').first();
  await db('printing_messages').where({ status: 'unread' }).update({ status: 'read', updated_at: db.fn.now() });
  storeLog(req, 'PRINTING_MESSAGES_ALL_READ', null, null, { markedRead: Number(unread?.c || 0) });
  res.json({ status: 'success' });
});

// ─── TOGGLE MESSAGE READ STATUS ───────────────────────────────────────────
exports.toggleReadStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const message = await db('printing_messages').where({ id }).first();
  await db('printing_messages').where({ id }).update({ status, updated_at: db.fn.now() });
  storeLog(req, 'PRINTING_MESSAGE_STATUS_UPDATED', id, message ? { status: message.status } : null, { status });
  res.json({ status: 'success' });
});

// ─── DELETE MESSAGE ────────────────────────────────────────────────────────
exports.deleteMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const message = await db('printing_messages').where({ id }).first();
  await db('printing_messages').where({ id }).delete();
  storeLog(req, 'PRINTING_MESSAGE_DELETED', id,
    message ? { name: message.name, email: message.email, message: message.message } : null,
    null);
  res.json({ status: 'success' });
});
