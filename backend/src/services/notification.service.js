const webpush = require('web-push');
const { db } = require('../config/database');
const config = require('../config/env');
require('dotenv').config();

// Configure web-push
webpush.setVapidDetails(
  'mailto:admin@sutana.com',
  process.env.VAPID_PUBLIC_KEY || 'BOk-bTz6T7Z2n_eYl1E4M5Jm4X5-w5pD9Y9T7B2q4y0=', // dummy key fallback
  process.env.VAPID_PRIVATE_KEY || 'dummy_private'
);

let ioInstance = null;

const toIntOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const initWebSocket = (io) => {
  ioInstance = io;
  // basic auth check for socket would go here in a real app
  io.on('connection', (socket) => {
    // Expect clients to send their user role/ID to join specific rooms
    socket.on('join', (userData) => {
      if (userData && userData.role) {
        socket.join(userData.role);
        socket.join(`user_${userData.id}`);
      }
    });
  });
};

/**
 * Sends a notification via WebSocket (if online) and Web Push (if offline/background).
 * recipientRole is used for broadcasting (e.g., 'CEO', 'Pharmacy Store Keeper')
 * recipientId is used for targeting a specific user
 */
const sendNotification = async (recipientRole, recipientId, notificationData) => {
  try {
    const { title, message, type, related_entity_id, link } = notificationData;

    // 1. Resolve user IDs
    let userIds = [];
    if (recipientRole && !recipientId) {
      // Broadcast to all users with this role (roles are in user_roles + roles tables)
      const users = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .join('users', 'user_roles.user_id', 'users.id')
        .where('roles.name', recipientRole)
        .whereNull('users.deleted_at')
        .select('users.id');
      userIds = users.map(u => u.id);
    } else if (recipientId) {
      userIds = [recipientId];
    }

    // 2. Save to DB
    if (userIds.length > 0) {
      const inserts = userIds.map(uid => ({
        user_id: uid,
        role_target: recipientRole || null,
        type: type || 'general',
        title,
        message,
        link: link || null,
        related_entity_id: toIntOrNull(related_entity_id),
        is_read: false
      }));
      await db('notifications').insert(inserts);
    } else {
      // Role-only broadcast with no matched users — still save with role_target
      await db('notifications').insert({
        user_id: null,
        role_target: recipientRole || null,
        type: type || 'general',
        title,
        message,
        link: link || null,
        related_entity_id: toIntOrNull(related_entity_id),
        is_read: false
      });
    }

    // 3. Emit via WebSocket
    if (ioInstance) {
      const payload = { title, message, type, link, related_entity_id, is_read: false, timestamp: new Date() };
      if (recipientRole) {
        ioInstance.to(recipientRole).emit('notification', payload);
      }
      if (recipientId) {
        ioInstance.to(`user_${recipientId}`).emit('notification', payload);
      }
      userIds.forEach(uid => ioInstance.to(`user_${uid}`).emit('notification', payload));
    }

    // 3. Send Web Push to all subscriptions of the relevant users
    if (await db.schema.hasTable('push_subscriptions') && userIds.length > 0) {
      const subscriptions = await db('push_subscriptions').whereIn('user_id', userIds);
      
      const pushPayload = JSON.stringify({
        title,
        body: message,
        data: { link, type }
      });

      const pushPromises = subscriptions.map(sub => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };
        return webpush.sendNotification(pushSubscription, pushPayload).catch(err => {
          console.error('Push error for sub:', sub.id, err.message);
          // could delete invalid subs here
        });
      });

      await Promise.all(pushPromises);
    }
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};

/**
 * Sends a notification to the FINANCE role.
 * Inserts a row into `notifications` (role_target = 'FINANCE', type = 'finance')
 * and emits a `finance-cash` socket event so finance users get a live bell update.
 * The finance role's allowed types include 'finance', so getMyNotificationsV2 returns it.
 */
const sendFinanceNotification = async ({ title, message, type = 'finance', link = null, related_entity_id = null }, io) => {
  try {
    const [id] = await db('notifications').insert({
      user_id: null,
      role_target: 'FINANCE',
      type,
      title,
      message,
      link: link || null,
      related_entity_id: toIntOrNull(related_entity_id),
      is_read: false
    });
    if (io) {
      io.emit('finance-cash', { id, title, message, type, link, related_entity_id, is_read: false, timestamp: new Date() });
    }
    return id;
  } catch (err) {
    console.error('Error sending finance notification:', err);
    return null;
  }
};

/**
 * Sends a notification to the CEO role (visible to Admin/CEO at the bell).
 * Inserts a row into `notifications` (role_target = 'CEO', type = 'general')
 * and emits a `ceo-cash` socket event so the CEO gets a live bell update.
 */
const sendCeoNotification = async ({ title, message, type = 'general', link = null, related_entity_id = null }, io) => {
  try {
    const [id] = await db('notifications').insert({
      user_id: null,
      role_target: 'CEO',
      type,
      title,
      message,
      link: link || null,
      related_entity_id: toIntOrNull(related_entity_id),
      is_read: false
    });
    if (io) {
      io.emit('ceo-cash', { id, title, message, type, link, related_entity_id, is_read: false, timestamp: new Date() });
    }
    return id;
  } catch (err) {
    console.error('Error sending CEO notification:', err);
    return null;
  }
};

/**
 * Sends a notification to the Printing Supervisor role.
 * Inserts a row into `notifications` (role_target = 'Printing Supervisor')
 * and emits a `printing-cash` socket event so printing users get a live bell update + sound.
 */
const sendPrintingNotification = async ({ title, message, type = 'printing', link = null, related_entity_id = null }, io) => {
  try {
    const [id] = await db('notifications').insert({
      user_id: null,
      role_target: 'Printing Supervisor',
      type,
      title,
      message,
      link: link || null,
      related_entity_id: toIntOrNull(related_entity_id),
      is_read: false
    });
    if (io) {
      io.emit('printing-cash', { id, title, message, type, link, related_entity_id, is_read: false, timestamp: new Date() });
    }
    return id;
  } catch (err) {
    console.error('Error sending printing notification:', err);
    return null;
  }
};

module.exports = {
  initWebSocket,
  sendNotification,
  sendFinanceNotification,
  sendCeoNotification,
  sendPrintingNotification
};
