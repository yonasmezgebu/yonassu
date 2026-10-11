const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const notificationRepository = require('../../repositories/notification.repository');

// --- PARTNER'S NEW NOTIFICATION METHODS ---
// Strict per-dashboard scoping: each role only receives notifications that
// belong to its own dashboard. No cross-department leakage.
const resolveNotificationScope = (roles = []) => {
  const lowerRoles = (roles || []).map(r => String(r).toLowerCase().trim());
  // Real CEO: full decision desk (every notification addressed to the CEO office)
  if (lowerRoles.some(r => r === 'ceo')) {
    return { roleTarget: 'CEO', allowedTypes: null, requireLink: false };
  }
  // Admin (acting approver): ONLY actionable approval-flow results that carry a
  // working deep-link (cash handover / EV / procurement / report decisions).
  // Blocks departmental request spam (prescriptions, tenders, stock updates...).
  if (lowerRoles.includes('admin')) {
    return { roleTarget: 'CEO', allowedTypes: ['general'], requireLink: true };
  }
  if (lowerRoles.some(r => r.includes('General Store Keeper'))) {
    return { roleTarget: 'General Store Keeper', allowedTypes: null, requireLink: false };
  }
  if (lowerRoles.some(r => r.includes('Pharmacy Store Keeper'))) {
    return { roleTarget: 'Pharmacy Store Keeper', allowedTypes: null, requireLink: false };
  }
  if (lowerRoles.some(r => r.includes('pharmacy manager') || r.includes('pharmacy worker'))) {
    return { roleTarget: 'Pharmacy Manager', allowedTypes: null, requireLink: false };
  }
  // Purchase Manager / Purchase office (checked BEFORE market so the dedicated
  // purchase role wins for users holding both) — everything addressed to purchasing
  if (lowerRoles.some(r => r.includes('purchase'))) {
    return { roleTarget: 'Purchase Manager', allowedTypes: null, requireLink: false };
  }
  if (lowerRoles.some(r => r.includes('market'))) {
    return { roleTarget: 'MANAGER', allowedTypes: ['general'], requireLink: false };
  }
  if (lowerRoles.some(r => r.includes('farming'))) {
    return { roleTarget: 'MANAGER', allowedTypes: ['general', 'farming'], requireLink: false };
  }
  if (lowerRoles.some(r => r.includes('renting') || r.includes('rental'))) {
    return { roleTarget: 'Car Renting Manager', allowedTypes: null, requireLink: false };
  }
  if (lowerRoles.some(r => ['finance manager', 'finance officer', 'finance'].includes(r))) {
    return { roleTarget: 'FINANCE', allowedTypes: ['general', 'finance'], requireLink: false };
  }
  if (lowerRoles.some(r => r.includes('hr'))) {
    return { roleTarget: 'HR Manager', allowedTypes: null, requireLink: false };
  }
  // Printing Supervisor / Printing Manager: everything addressed to the printing office
  if (lowerRoles.some(r => r.includes('printing'))) {
    return { roleTarget: 'Printing Supervisor', allowedTypes: null, requireLink: false };
  }
  return { roleTarget: 'CUSTOMER', allowedTypes: null, requireLink: false };
};

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roleTarget, allowedTypes, requireLink } = resolveNotificationScope(req.user.roles);

    const notifications = await notificationRepository.getForUserOrRole(userId, roleTarget, allowedTypes, requireLink);
    res.status(200).json({ status: 'success', data: notifications.map(n => n.toJSON()) });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await notificationRepository.markAsRead(req.params.id);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roleTarget, allowedTypes, requireLink } = resolveNotificationScope(req.user.roles);

    await notificationRepository.markAllAsRead(userId, roleTarget, allowedTypes, requireLink);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};

// --- YOUR OLD NOTIFICATION METHODS ---

exports.getNotifications = catchAsync(async (req, res) => {
  const { unreadOnly = false } = req.query;
  const userId = req.user.id;

  // 1. Fetch internal notifications
  let userQuery = db('user_notifications')
    .select('id', 'title', 'message', 'type', 'is_read', 'link_url', 'created_at', db.raw("'internal' as source"))
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .limit(50);
  
  if (unreadOnly === 'true') {
    userQuery = userQuery.where('is_read', false);
  }
  const internalNotifs = await userQuery;

  // 2. Fetch customer notifications if they have a profile
  const customer = await db('customers').where('user_id', userId).orWhere('email', req.user.email).first();
  let customerNotifs = [];
  if (customer) {
    let custQuery = db('customer_notifications')
      .select('id', 'title', 'message', 'type', 'is_read', 'link_url', 'created_at', db.raw("'customer' as source"))
      .where('customer_id', customer.id)
      .orderBy('created_at', 'desc')
      .limit(50);
      
    if (unreadOnly === 'true') {
      custQuery = custQuery.where('is_read', false);
    }
    customerNotifs = await custQuery;
  }

  // 3. Merge and sort
  const notifications = [...internalNotifs, ...customerNotifs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  res.json({
    status: 'success',
    data: { notifications }
  });
});

exports.markRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { source } = req.body;
  const userId = req.user.id;

  if (source === 'customer') {
    const customer = await db('customers').where('user_id', userId).orWhere('email', req.user.email).first();
    if (customer) {
      await db('customer_notifications').where({ id, customer_id: customer.id }).update({ is_read: true });
    }
  } else {
    await db('user_notifications').where({ id, user_id: userId }).update({ is_read: true });
  }

  res.json({ status: 'success', message: 'Notification marked as read' });
});

exports.markAllRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await db('user_notifications').where({ user_id: userId, is_read: false }).update({ is_read: true });
  
  const customer = await db('customers').where('user_id', userId).orWhere('email', req.user.email).first();
  if (customer) {
    await db('customer_notifications').where({ customer_id: customer.id, is_read: false }).update({ is_read: true });
  }

  res.json({ status: 'success', message: 'All notifications marked as read' });
});
