const { db } = require('../config/database');
const Notification = require('../models/Notification.model');

class NotificationRepository {
  async create(data) {
    const [result] = await db('notifications').insert({
      user_id: data.userId || null,
      role_target: data.roleTarget || null,
      title: data.title,
      message: data.message,
      type: data.type || 'general',
      link: data.link || null,
      is_read: false
    });
    return result;
  }

  async getForUserOrRole(userId, roleTarget, allowedTypes, requireLink = false) {
    try {
      let query = db('notifications').where('user_id', userId);
      if (roleTarget) {
        query = query.orWhere(function() {
          this.whereRaw('LOWER(role_target) = LOWER(?)', [roleTarget]);
          if (allowedTypes && allowedTypes.length) {
            this.whereIn('type', allowedTypes);
          }
          if (requireLink) {
            this.whereNotNull('link').andWhere('link', '<>', '');
          }
        });
      }
      query = query.orderBy('created_at', 'desc');
      const rows = await query;
      return rows.map(Notification.fromDatabase);
    } catch (_) {
      // Fallback: if type column doesn't exist yet, return unfiltered
      const rows = await db('notifications')
        .where('user_id', userId)
        .orWhereRaw('LOWER(role_target) = LOWER(?)', [roleTarget])
        .orderBy('created_at', 'desc');
      return rows.map(Notification.fromDatabase);
    }
  }

  async markAsRead(id) {
    await db('notifications').where('id', id).update({ is_read: true });
  }

  async markByLink(linkPattern) {
    await db('notifications').where('link', linkPattern).update({ is_read: true });
  }

  async markAllAsRead(userId, roleTarget, allowedTypes, requireLink = false) {
    try {
      let query = db('notifications').where('user_id', userId);
      if (roleTarget) {
        query = query.orWhere(function() {
          this.whereRaw('LOWER(role_target) = LOWER(?)', [roleTarget]);
          if (allowedTypes && allowedTypes.length) {
            this.whereIn('type', allowedTypes);
          }
          if (requireLink) {
            this.whereNotNull('link').andWhere('link', '<>', '');
          }
        });
      }
      await query.update({ is_read: true });
    } catch (_) {
      // Fallback
      await db('notifications')
        .where('user_id', userId)
        .orWhereRaw('LOWER(role_target) = LOWER(?)', [roleTarget])
        .update({ is_read: true });
    }
  }
}

module.exports = new NotificationRepository();
