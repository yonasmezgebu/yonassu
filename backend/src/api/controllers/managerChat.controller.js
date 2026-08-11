const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

// All users who can participate in manager chat
const ALLOWED_ROLES = [
  'CEO', 'Admin', 'HR Manager', 'Car Rental Manager', 'Car Renting Manager',
  'Printing Supervisor', 'Printing Manager',
  'Pharmacy Manager', 'Sales Manager', 'Purchase Manager', 'Purchase',
  'Board Member', 'Board', 'General Store Manager', 'General Store Keeper', 'Pharmacy Store Manager',
  'Pharmacy Worker', 'Sales/Cashier', 'Employee'
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
  const { receiverId, message, replyToId } = req.body;
  if (!receiverId || !message?.trim()) throw AppError.badRequest('receiverId and message required');

  const target = await db('users').where({ id: parseInt(receiverId, 10), chat_enabled: true }).first();
  if (!target) throw AppError.badRequest('Receiver is unavailable or chat disabled');

  const [id] = await db('manager_chats').insert({
    sender_user_id: me,
    receiver_user_id: parseInt(receiverId, 10),
    message: message.trim(),
    reply_to_id: replyToId ? parseInt(replyToId, 10) : null,
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
exports.getUnreadCounts = catchAsync(async (req, res) => {
  const me = req.user.id;
  const counts = await db('manager_chats')
    .where({ receiver_user_id: me, seen_at: null })
    .groupBy('sender_user_id')
    .select('sender_user_id')
    .count('* as count');
    
  const result = {};
  counts.forEach(row => {
    result[row.sender_user_id] = row.count;
  });
  res.json({ status: 'success', data: result });
});

exports.getUsers = catchAsync(async (req, res) => {
  const me = req.user.id;
  const users = await db('users')
    .where({ chat_enabled: true })
    .whereNot({ id: me })
    .select('id', 'full_name as name', 'role', 'profile_photo as avatar')
    .orderBy('full_name', 'asc');
  res.json({ status: 'success', data: users });
});

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

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD for DMs
// ─────────────────────────────────────────────────────────────────────────────
exports.sendFile = catchAsync(async (req, res) => {
  const me = req.user.id;
  const { receiverId, message, replyToId } = req.body;
  if (!receiverId || !req.file) throw AppError.badRequest('receiverId and file required');
  const target = await db('users').where({ id: parseInt(receiverId, 10), chat_enabled: true }).first();
  if (!target) throw AppError.badRequest('Receiver unavailable');
  const fileUrl = `/uploads/chat/${req.file.filename}`;
  const [id] = await db('manager_chats').insert({
    sender_user_id: me,
    receiver_user_id: parseInt(receiverId, 10),
    message: message || '',
    file_url: fileUrl,
    file_name: req.file.originalname,
    file_type: req.file.mimetype,
    reply_to_id: replyToId ? parseInt(replyToId, 10) : null,
  });
  const created = await db('manager_chats').where({ id }).first();
  res.status(201).json({ status: 'success', data: created });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP CHAT
// ─────────────────────────────────────────────────────────────────────────────

exports.getMyGroups = catchAsync(async (req, res) => {
  const rows = await db('manager_chat_groups as g')
    .select('g.id', 'g.name', 'g.description', 'g.profile_photo', 'g.created_by', 'g.created_at');
    
  for (const row of rows) {
    const c = await db('manager_chat_group_members').where('group_id', row.id).count('id as cnt').first();
    row.member_count = Number(c?.cnt || 0);
  }
  res.json({ status: 'success', data: rows });
});

exports.createGroup = catchAsync(async (req, res) => {
  const me = req.user.id;
  
  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (!isCeo) throw AppError.forbidden('Only the CEO can create new groups');

  const { name, description, memberIds } = req.body;
  if (!name?.trim()) throw AppError.badRequest('Group name is required');
  
  let profile_photo = null;
  if (req.file) {
    profile_photo = `/uploads/chat/${req.file.filename}`;
  }

  const [groupId] = await db('manager_chat_groups').insert({ 
    name: name.trim(), 
    description: description || null, 
    profile_photo,
    created_by: me 
  });
  
  let parsedMembers = [];
  try {
    parsedMembers = typeof memberIds === 'string' ? JSON.parse(memberIds) : (memberIds || []);
  } catch(e) {}

  const members = [...new Set([me, ...parsedMembers])];
  for (const uid of members) {
    await db('manager_chat_group_members').insert({ group_id: groupId, user_id: uid }).onConflict(['group_id','user_id']).ignore();
  }
  const group = await db('manager_chat_groups').where({ id: groupId }).first();
  res.status(201).json({ status: 'success', data: group });
});

exports.updateGroupPhoto = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const group = await db('manager_chat_groups').where({ id: groupId }).first();
  if (!group) throw AppError.notFound('Group not found');
  
  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (group.created_by !== me && !isCeo) throw AppError.forbidden('Only creator or CEO can update group photo');
  
  if (!req.file) throw AppError.badRequest('Photo file is required');
  
  const profile_photo = `/uploads/chat/${req.file.filename}`;
  await db('manager_chat_groups').where({ id: groupId }).update({ profile_photo });
  
  res.json({ status: 'success', profile_photo });
});

exports.getGroupMessages = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const membership = await db('manager_chat_group_members').where({ group_id: groupId, user_id: me }).first();
  if (membership && membership.is_banned) throw AppError.forbidden('Banned from this group');
  const msgs = await db('manager_chat_group_messages as m')
    .join('users as u', 'u.id', 'm.sender_user_id')
    .where('m.group_id', groupId).where('m.deleted', false)
    .select('m.id','m.group_id','m.sender_user_id','m.message','m.file_url','m.file_name','m.file_type','m.reply_to_id','m.reactions','m.created_at','u.full_name as sender_name','u.profile_photo as sender_avatar')
    .orderBy('m.created_at', 'asc');
  res.json({ status: 'success', data: msgs });
});

exports.sendGroupMessage = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const membership = await db('manager_chat_group_members').where({ group_id: groupId, user_id: me }).first();
  if (membership && membership.is_banned) throw AppError.forbidden('Not allowed');
  const { message, replyToId } = req.body;
  const fileUrl  = req.file ? `/uploads/chat/${req.file.filename}` : null;
  const fileName = req.file ? req.file.originalname : null;
  const fileType = req.file ? req.file.mimetype : null;
  if (!message?.trim() && !fileUrl) throw AppError.badRequest('Message or file required');
  const [id] = await db('manager_chat_group_messages').insert({ 
    group_id: groupId, 
    sender_user_id: me, 
    message: message?.trim() || '', 
    file_url: fileUrl, 
    file_name: fileName, 
    file_type: fileType,
    reply_to_id: replyToId ? parseInt(replyToId, 10) : null
  });
  const created = await db('manager_chat_group_messages as m').join('users as u','u.id','m.sender_user_id').where('m.id',id).select('m.*','u.full_name as sender_name','u.profile_photo as sender_avatar').first();
  res.status(201).json({ status: 'success', data: created });
});

exports.getGroupMembers = catchAsync(async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);
  const members = await db('manager_chat_group_members as gm')
    .join('users as u','u.id','gm.user_id')
    .leftJoin('user_roles as ur','ur.user_id','u.id')
    .leftJoin('roles as r','r.id','ur.role_id')
    .where('gm.group_id', groupId)
    .select('u.id','u.full_name as name','u.profile_photo as avatar','r.name as role','gm.is_banned','gm.joined_at');
  const seen = new Set(); const unique = [];
  for (const m of members) { if (!seen.has(m.id)) { seen.add(m.id); unique.push(m); } }
  res.json({ status: 'success', data: unique });
});

exports.addGroupMember = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const { userId } = req.body;
  const group = await db('manager_chat_groups').where({ id: groupId }).first();
  if (!group) throw AppError.notFound('Group not found');
  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (group.created_by !== me && !isCeo) throw AppError.forbidden('Only creator or CEO can add members');
  await db('manager_chat_group_members').insert({ group_id: groupId, user_id: parseInt(userId,10) }).onConflict(['group_id','user_id']).merge({ is_banned: false });
  res.json({ status: 'success' });
});

exports.removeGroupMember = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const userId  = parseInt(req.params.userId, 10);
  const group = await db('manager_chat_groups').where({ id: groupId }).first();
  if (!group) throw AppError.notFound('Group not found');
  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (group.created_by !== me && !isCeo) throw AppError.forbidden('Only creator or CEO can remove members');
  await db('manager_chat_group_members').where({ group_id: groupId, user_id: userId }).delete();
  res.json({ status: 'success' });
});

exports.leaveGroup = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  await db('manager_chat_group_members').where({ group_id: groupId, user_id: me }).delete();
  res.json({ status: 'success' });
});

exports.banGroupMember = catchAsync(async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);
  const userId  = parseInt(req.params.userId, 10);
  const { ban } = req.body;
  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (!isCeo) throw AppError.forbidden('Only CEO can ban members');
  await db('manager_chat_group_members').where({ group_id: groupId, user_id: userId }).update({ is_banned: ban ? 1 : 0 });
  res.json({ status: 'success' });
});

exports.deleteGroup = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const group = await db('manager_chat_groups').where({ id: groupId }).first();
  if (!group) throw AppError.notFound('Group not found');
  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (group.created_by !== me && !isCeo) throw AppError.forbidden('Only creator or CEO can delete the group');
  await db('manager_chat_group_members').where({ group_id: groupId }).delete();
  await db('manager_chat_group_messages').where({ group_id: groupId }).delete();
  await db('manager_chat_groups').where({ id: groupId }).delete();
  res.json({ status: 'success' });
});

// ─────────────────────────────────────────────────────────────────────────────
// REACTIONS & DELETIONS
// ─────────────────────────────────────────────────────────────────────────────

exports.reactToDm = catchAsync(async (req, res) => {
  const me = req.user.id;
  const msgId = parseInt(req.params.messageId, 10);
  const { emoji } = req.body;
  if (!emoji) throw AppError.badRequest('Emoji is required');

  const msg = await db('manager_chats').where({ id: msgId }).first();
  if (!msg) throw AppError.notFound('Message not found');

  let reactions = msg.reactions ? JSON.parse(msg.reactions) : {};
  if (!reactions[emoji]) reactions[emoji] = [];
  
  if (reactions[emoji].includes(me)) {
    reactions[emoji] = reactions[emoji].filter(id => id !== me);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji].push(me);
  }

  await db('manager_chats').where({ id: msgId }).update({ reactions: JSON.stringify(reactions) });
  res.json({ status: 'success', reactions });
});

exports.reactToGroupMessage = catchAsync(async (req, res) => {
  const me = req.user.id;
  const msgId = parseInt(req.params.messageId, 10);
  const { emoji } = req.body;
  if (!emoji) throw AppError.badRequest('Emoji is required');

  const msg = await db('manager_chat_group_messages').where({ id: msgId }).first();
  if (!msg) throw AppError.notFound('Message not found');

  let reactions = msg.reactions ? JSON.parse(msg.reactions) : {};
  if (!reactions[emoji]) reactions[emoji] = [];
  
  if (reactions[emoji].includes(me)) {
    reactions[emoji] = reactions[emoji].filter(id => id !== me);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji].push(me);
  }

  await db('manager_chat_group_messages').where({ id: msgId }).update({ reactions: JSON.stringify(reactions) });
  res.json({ status: 'success', reactions });
});

exports.deleteGroupMessage = catchAsync(async (req, res) => {
  const me = req.user.id;
  const groupId = parseInt(req.params.groupId, 10);
  const msgId = parseInt(req.params.messageId, 10);

  const group = await db('manager_chat_groups').where({ id: groupId }).first();
  if (!group) throw AppError.notFound('Group not found');

  const msg = await db('manager_chat_group_messages').where({ id: msgId, group_id: groupId }).first();
  if (!msg) throw AppError.notFound('Message not found');

  const isCeo = req.user.roles?.includes('CEO') || req.user.role === 'CEO';
  if (msg.sender_user_id !== me && group.created_by !== me && !isCeo) {
    throw AppError.forbidden('You cannot delete this message');
  }

  await db('manager_chat_group_messages').where({ id: msgId }).update({ deleted: true });
  res.json({ status: 'success' });
});

