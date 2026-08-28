const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendNotification } = require('../../services/notification.service');

exports.subscribe = catchAsync(async (req, res) => {
  const { email, full_name, source } = req.body;
  if (!email || !email.trim()) throw new AppError('Email is required', 400);

  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new AppError('Invalid email address', 400);

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
  const ua = (req.headers['user-agent'] || '').slice(0, 512);

  const existing = await db('email_subscribers').where('email', clean).whereNull('deleted_at').first();

  if (existing) {
    if (existing.status === 'unsubscribed') {
      await db('email_subscribers').where('id', existing.id).update({ status: 'active', unsubscribed_at: null, updated_at: db.fn.now() });
      await sendNotification('CEO', null, {
        title: 'Subscriber Re-subscribed',
        message: `A previous subscriber rejoined: ${clean}`,
        type: 'general',
        link: '/admin/subscribers',
      });
      return res.json({ status: 'success', message: 'Welcome back! You have been re-subscribed.' });
    }
    return res.json({ status: 'success', message: 'You are already subscribed!' });
  }

  await db('email_subscribers').insert({
    email: clean,
    full_name: (full_name || '').trim() || null,
    source: source || 'landing_page',
    ip_address: ip,
    user_agent: ua,
    status: 'active',
  });

  await sendNotification('CEO', null, {
    title: 'New Subscriber',
    message: `${clean}${full_name ? ` (${full_name.trim()})` : ''} subscribed via ${source || 'landing page'}`,
    type: 'general',
    link: '/admin/subscribers',
  });

  res.status(201).json({ status: 'success', message: 'Thank you for subscribing! You will receive our latest updates.' });
});

exports.listSubscribers = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, status = 'all', search = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = db('email_subscribers').whereNull('deleted_at');
  if (status !== 'all') query = query.where('status', status);
  if (search) query = query.where(function () { this.where('email', 'like', `%${search}%`).orWhere('full_name', 'like', `%${search}%`); });

  const [{ total }] = await query.clone().count('* as total');
  const subscribers = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

  const stats = await db('email_subscribers').whereNull('deleted_at')
    .select('status')
    .count('* as cnt')
    .groupBy('status');

  const statsMap = { active: 0, unsubscribed: 0, bounced: 0, spam: 0, total: parseInt(total) };
  stats.forEach(s => { statsMap[s.status] = parseInt(s.cnt); });

  res.json({
    status: 'success',
    data: {
      subscribers,
      stats: statsMap,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total), totalPages: Math.ceil(total / limit) },
    }
  });
});

exports.deleteSubscriber = catchAsync(async (req, res) => {
  const { id } = req.params;
  const sub = await db('email_subscribers').where('id', id).whereNull('deleted_at').first();
  if (!sub) throw new AppError('Subscriber not found', 404);
  await db('email_subscribers').where('id', id).update({ deleted_at: db.fn.now() });
  await sendNotification('CEO', null, {
    title: 'Subscriber Removed',
    message: `${sub.email} was removed by an administrator`,
    type: 'general',
    link: '/admin/subscribers',
  });
  res.json({ status: 'success', message: 'Subscriber deleted' });
});

exports.toggleStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sub = await db('email_subscribers').where('id', id).whereNull('deleted_at').first();
  if (!sub) throw new AppError('Subscriber not found', 404);
  await db('email_subscribers').where('id', id).update({ status, updated_at: db.fn.now() });

  const labelMap = { active: 'reactivated', unsubscribed: 'unsubscribed', bounced: 'marked as bounced', spam: 'marked as spam' };
  await sendNotification('CEO', null, {
    title: status === 'active' ? 'Subscriber Restored' : 'Subscriber Updated',
    message: `${sub.email} was ${labelMap[status] || status} by an administrator`,
    type: 'general',
    link: '/admin/subscribers',
  });
  res.json({ status: 'success', message: `Subscriber marked as ${status}` });
});

exports.exportCsv = catchAsync(async (req, res) => {
  const { status = 'all' } = req.query;
  let query = db('email_subscribers').whereNull('deleted_at');
  if (status !== 'all') query = query.where('status', status);
  const rows = await query.orderBy('created_at', 'desc');

  const header = 'Email,Full Name,Status,Source,Subscribed At\n';
  const csv = header + rows.map(r =>
    `"${r.email}","${r.full_name || ''}","${r.status}","${r.source}","${r.created_at}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="email_subscribers.csv"');
  res.send(csv);
});

exports.toggleStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sub = await db('email_subscribers').where('id', id).whereNull('deleted_at').first();
  if (!sub) throw new AppError('Subscriber not found', 404);
  await db('email_subscribers').where('id', id).update({ status, updated_at: db.fn.now() });
  res.json({ status: 'success', message: `Subscriber marked as ${status}` });
});
