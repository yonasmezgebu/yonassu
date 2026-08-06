const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// All users who can participate in manager chat
const ALLOWED_ROLES = [
  'CEO', 'Admin', 'HR Manager', 'Car Rental Manager', 'Car Renting Manager',
  'Printing Supervisor', 'Printing Manager',
  'Pharmacy Manager', 'Sales Manager', 'Purchase Manager', 'Purchase',
  'Board Member', 'Board', 'General Store Manager', 'General Store Keeper', 'Pharmacy Store Manager'
];

// GET /manager-chat/users — list all manager users (for contact list)
exports.getManagerUsers = catchAsync(async (req, res) => {
  const me = req.user.id;
  
  const users = await db('users')
    .join('user_roles', 'users.id', 'user_roles.user_id')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .whereIn('roles.name', ALLOWED_ROLES)
    .where('users.id', '!=', me)
    .whereNull('users.deleted_at')
    .where('users.chat_enabled', true)
    .select(
      'users.id', 
      'users.full_name as name', 
      'roles.name as role', 
      'users.profile_photo as avatar',
      'users.phone'
    );

  // Group by unique user id, pick the manager role (the one in ALLOWED_ROLES)
  const ALLOWED_SET = new Set(ALLOWED_ROLES);
  const uniqueUsers = [];
  const seen = new Set();
  for (const u of users) {
    if (!seen.has(u.id)) {
      seen.add(u.id);
      uniqueUsers.push({
        id: u.id,
        name: u.name,
        role: ALLOWED_SET.has(u.role) ? u.role : u.role, // already filtered by whereIn
        avatar: u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000/${u.avatar}`) : null,
        phone: u.phone
      });
    } else {
      // If we already have this user but a better (manager) role comes, update it
      const existing = uniqueUsers.find(x => x.id === u.id);
      if (existing && ALLOWED_SET.has(u.role)) {
        existing.role = u.role;
      }
    }
  }

  res.json({ status: 'success', data: uniqueUsers });
});

// GET /manager-chat/conversation/:partnerId — get all messages with partner
exports.getConversation = catchAsync(async (req, res) => {
  const me = req.user.id;
  const partner = parseInt(req.params.partnerId, 10);

  const messages = await db('manager_chats')
    .where(function () {
      this.where('sender_user_id', me).andWhere('receiver_user_id', partner);
    })
    .orWhere(function () {
      this.where('sender_user_id', partner).andWhere('receiver_user_id', me);
    })
    .orderBy('created_at', 'asc');

  // Filter out deleted-for-me messages
  const visible = messages.filter(m => {
    if (m.sender_user_id === me && m.deleted_by_sender) return false;
    if (m.receiver_user_id === me && m.deleted_by_receiver) return false;
    return true;
  });

  // Mark unread messages from partner as seen
  await db('manager_chats')
    .where('sender_user_id', partner)
    .andWhere('receiver_user_id', me)
    .whereNull('seen_at')
    .update({ seen_at: db.fn.now() });

  res.json({ status: 'success', data: visible });
});

// POST /manager-chat/send — send a message
exports.sendMessage = catchAsync(async (req, res) => {
  const me = req.user.id;
  const { receiverId, message } = req.body;
  if (!receiverId || !message?.trim()) throw AppError.badRequest('receiverId and message required');

  const target = await db('users').where({ id: parseInt(receiverId, 10), chat_enabled: true }).first();
  if (!target) throw AppError.badRequest('Receiver is unavailable or chat disabled');

  const [id] = await db('manager_chats').insert({
    sender_user_id: me,
    receiver_user_id: parseInt(receiverId, 10),
    message: message.trim(),
  });
  const created = await db('manager_chats').where({ id }).first();
  res.status(201).json({ status: 'success', data: created });
});

// DELETE /manager-chat/:messageId — delete message
exports.deleteMessage = catchAsync(async (req, res) => {
  const me = req.user.id;
  const msgId = parseInt(req.params.messageId, 10);
  const type = req.query.type || 'me';

  const msg = await db('manager_chats').where({ id: msgId }).first();
  if (!msg) throw AppError.notFound('Message not found');
  if (msg.sender_user_id !== me && msg.receiver_user_id !== me) {
    throw AppError.forbidden('Not your message');
  }

  if (msg.sender_user_id === me) {
    if (type === 'everyone') {
      await db('manager_chats').where({ id: msgId }).update({ deleted_by_sender: true, deleted_by_receiver: true });
    } else {
      await db('manager_chats').where({ id: msgId }).update({ deleted_by_sender: true });
    }
  } else {
    await db('manager_chats').where({ id: msgId }).update({ deleted_by_receiver: true });
  }

  res.json({ status: 'success' });
});

exports.getAdminUsers = catchAsync(async (req, res) => {
  const users = await db('users')
    .join('user_roles', 'users.id', 'user_roles.user_id')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .whereIn('roles.name', ALLOWED_ROLES)
    .whereNull('users.deleted_at')
    .select('users.id', 'users.full_name as name', 'roles.name as role', 'users.profile_photo as avatar', 'users.phone', 'users.chat_enabled');

  const uniqueUsers = [];
  const seen = new Set();
  for (const u of users) {
    if (!seen.has(u.id)) {
      seen.add(u.id);
      uniqueUsers.push({
        id: u.id,
        name: u.name,
        role: u.role,
        avatar: u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000/${u.avatar}`) : null,
        phone: u.phone,
        chat_enabled: Boolean(u.chat_enabled)
      });
    }
  }

  res.json({ status: 'success', data: uniqueUsers });
});

exports.toggleChatAccess = catchAsync(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const user = await db('users').where({ id: targetId }).first();
  if (!user) throw AppError.notFound('User not found');
  await db('users').where({ id: targetId }).update({ chat_enabled: !user.chat_enabled });
  res.json({ status: 'success', chat_enabled: !user.chat_enabled });
});

// GET /manager-chat/unread-count — total unread for me
exports.getUnreadCount = catchAsync(async (req, res) => {
  const me = req.user.id;
  const row = await db('manager_chats')
    .where('receiver_user_id', me)
    .whereNull('seen_at')
    .where('deleted_by_receiver', false)
    .count('id as count')
    .first();
  res.json({ status: 'success', count: Number(row?.count || 0) });
});
