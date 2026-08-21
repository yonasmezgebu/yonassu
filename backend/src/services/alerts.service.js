const { db } = require('../config/database');
const { randomUUID } = require('crypto');
const os = require('os');
let _sendNotification = null; /* ALERTS_NOTIF_IMPORT */
function getSendNotification() {
  if (!_sendNotification) { try { _sendNotification = require('./notification.service').sendNotification; } catch(e) {} }
  return _sendNotification;
}

const TYPE_PRIORITY = { CRITICAL: 1, WARNING: 2, INFO: 3 };

/* ─────────────────────────────────────────────
   Ensure the centralized `alerts` table exists.
   Mirrors the migration so the feature works even
   if migrations have not been run yet.
   ───────────────────────────────────────────── */
async function ensureAlertsTable() {
  try {
    const exists = await db.schema.hasTable('alerts');
    if (exists) return;
    await db.schema.createTable('alerts', (t) => {
      t.string('id', 36).primary();
      t.enu('type', ['CRITICAL', 'WARNING', 'INFO']).notNullable();
      t.string('module', 50).notNullable();
      t.string('title', 200).notNullable();
      t.text('message').notNullable();
      t.integer('priority').notNullable().defaultTo(5);
      t.integer('target_user_id').unsigned().nullable();
      t.string('target_role', 100).nullable();
      t.enu('status', ['UNREAD', 'READ', 'RESOLVED']).notNullable().defaultTo('UNREAD');
      t.string('related_record_id', 100).nullable();
      t.string('related_module', 50).nullable();
      t.string('fingerprint', 200).unique().nullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  } catch (e) {
    console.error('ensureAlertsTable failed:', e.message);
  }
}
ensureAlertsTable();

/* ─────────────────────────────────────────────
   Insert one alert. Deduplicated by fingerprint so
   repeated generation passes do not create duplicates.
   Alerts are routed to a target role (default Admin)
   or to a specific user.
   ───────────────────────────────────────────── */
const createAlert = async ({
  type,
  module,
  title,
  message,
  targetUserId = null,
  targetRole = 'Admin',
  relatedRecordId = null,
  relatedModule = null,
  fingerprint = null,
}) => {
  try {
    if (fingerprint) {
      const exists = await db('alerts').where('fingerprint', fingerprint).first();
      if (exists) return false;
    }
    await db('alerts').insert({
      id: randomUUID(),
      type,
      module,
      title,
      message,
      priority: TYPE_PRIORITY[type] || 5,
      target_user_id: targetUserId || null,
      target_role: targetRole || null,
      related_record_id: relatedRecordId != null ? String(relatedRecordId) : null,
      related_module: relatedModule || null,
      fingerprint: fingerprint || null,
      status: 'UNREAD',
      created_at: db.fn.now(),
    });
    /* ALERTS_NOTIF_SEND */
    try {
      const sn = getSendNotification();
      if (sn) {
        await sn(targetRole || null, targetUserId || null, {
          title: title,
          message: message.length > 120 ? message.substring(0, 120) + '...' : message,
          type: 'alert',
          link: '/admin/alerts'
        });
      }
    } catch (notifErr) { console.error('Alert notification error:', notifErr); }
    return true;
  } catch (e) {
    console.error('createAlert failed:', e.message);
    return false;
  }
};

const autoResolve = async (fingerprint) => {
  try {
    await db('alerts')
      .where('fingerprint', fingerprint)
      .whereIn('status', ['UNREAD', 'READ'])
      .update({ status: 'RESOLVED' });
  } catch (e) {
    console.error('autoResolve failed:', e.message);
  }
};

/* State-based alert: create when the condition is true,
   auto-resolve when the condition clears, and re-open
   (back to UNREAD) if the issue recurs after being resolved. */
const syncStateAlert = async (alert) => {
  if (alert.active) {
    const existing = alert.fingerprint
      ? await db('alerts').where('fingerprint', alert.fingerprint).first()
      : null;
    if (!existing) {
      await createAlert(alert);
    } else if (existing.status === 'RESOLVED') {
      await db('alerts').where('id', existing.id).update({ status: 'UNREAD' });
    }
  } else {
    await autoResolve(alert.fingerprint);
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ─────────────────────────────────────────────
   Alert generator — each module defines its own
   trigger condition and writes to the alerts table.
   Every check is isolated so a failure never breaks
   the whole list. Follows the rule: routine history
   stays in the audit log; only genuine risks/notifications
   become alerts.
   ───────────────────────────────────────────── */
async function syncAlerts() {
  await ensureAlertsTable();

  // ── CRITICAL · Security ──
  try {
    const row = await db('central_audit_logs')
      .where('action', 'UNAUTHORIZED_ACCESS_ATTEMPT')
      .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)'))
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(row.count) > 0,
      type: 'CRITICAL',
      module: 'Security',
      title: 'Unauthorized Access Attempts',
      message: `${parseInt(row.count)} unauthorized access attempt(s) detected in the last 24 hours. Possible intrusion — review immediately.`,
      fingerprint: 'unauthorized-access',
    });
  } catch (e) { /* table/column unavailable — skip */ }

  try {
    const offenders = await db('users')
      .where('failed_login_attempts', '>=', 3)
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(offenders.count) > 0,
      type: 'CRITICAL',
      module: 'Security',
      title: 'Failed Login Attempts',
      message: `${parseInt(offenders.count)} account(s) have repeated failed login attempts (3+). Possible password brute force — check these accounts.`,
      fingerprint: 'failed-logins',
    });
  } catch (e) { /* skip */ }

  // ── CRITICAL · Security (account locked / disabled) ──
  try {
    const locked = await db('users')
      .whereNotNull('lockout_until')
      .where('lockout_until', '>', db.fn.now())
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(locked.count) > 0,
      type: 'CRITICAL',
      module: 'Security',
      title: 'Account Locked / Disabled',
      message: `${parseInt(locked.count)} user account(s) are currently locked due to failed login attempts. Contact affected users.`,
      fingerprint: 'account-locked',
    });
  } catch (e) { /* skip */ }

  // ── CRITICAL · Security (suspicious login / unrecognized device) ──
  try {
    const anomalies = await db('session_anomalies')
      .where('detected_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)'))
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(anomalies.count) > 0,
      type: 'CRITICAL',
      module: 'Security',
      title: 'Suspicious Login / Unrecognized Device',
      message: `${parseInt(anomalies.count)} suspicious session/anomaly event(s) detected in the last 24 hours. Verify these sign-ins.`,
      fingerprint: 'suspicious-login',
    });
  } catch (e) { /* skip */ }

  // ── CRITICAL · Inventory ──
  try {
    const expired = await db('products')
      .whereNotNull('expiry_date')
      .whereRaw('expiry_date < CURDATE()')
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(expired.count) > 0,
      type: 'CRITICAL',
      module: 'Inventory',
      title: 'Expired Products',
      message: `${parseInt(expired.count)} product(s) have passed their expiry date and must be removed from saleable stock immediately.`,
      fingerprint: 'expired-products',
    });
  } catch (e) { /* skip */ }

  try {
    const negative = await db('inventory')
      .where('quantity', '<', 0)
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(negative.count) > 0,
      type: 'CRITICAL',
      module: 'Inventory',
      title: 'Negative Stock',
      message: `${parseInt(negative.count)} stock item(s) have a negative quantity. Stock movements are out of balance and need correction.`,
      fingerprint: 'negative-stock',
    });
  } catch (e) { /* skip */ }

  // ── CRITICAL · Inventory (very low inventory) ──
  try {
    const veryLow = await db('products as p')
      .leftJoin('inventory as i', 'p.id', 'i.product_id')
      .where('p.reorder_level', '>', 0)
      .whereRaw('COALESCE(i.quantity, 0) <= 0.1 * p.reorder_level')
      .select('p.id', 'p.name', db.raw('COALESCE(i.quantity, 0) as stock'), 'p.reorder_level');
    if (veryLow.length > 0) {
      const top = veryLow.slice(0, 3).map((r) => `${r.name} (${r.stock}/${r.reorder_level})`).join(', ');
      await createAlert({
        type: 'CRITICAL',
        module: 'Inventory',
        title: 'Very Low Inventory',
        message: `${veryLow.length} product(s) are critically low (10% or less of reorder level) — e.g. ${top}. Immediate restocking required.`,
        relatedRecordId: veryLow[0].id,
        relatedModule: 'product',
        fingerprint: 'very-low-stock',
      });
    } else {
      await autoResolve('very-low-stock');
    }
  } catch (e) { /* skip */ }

  // ── CRITICAL · System (backup failure) ──
  try {
    const backup = await db('settings').where('setting_key', 'last_backup_status').first();
    const failed = backup && backup.setting_value === 'failed';
    await syncStateAlert({
      active: !!failed,
      type: 'CRITICAL',
      module: 'System',
      title: 'Backup Job Failed',
      message: 'The most recent scheduled backup job failed. Your data may be at risk — run a backup now.',
      fingerprint: 'backup-failure',
    });
  } catch (e) { /* skip */ }

  // ── WARNING · Inventory (low stock / reorder level) ──
  try {
    const lowStock = await db('products as p')
      .leftJoin('inventory as i', 'p.id', 'i.product_id')
      .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
      .select('p.id', 'p.name', db.raw('COALESCE(i.quantity, 0) as stock'), 'p.reorder_level')
      .orderByRaw('(COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) ASC');
    if (lowStock.length > 0) {
      const top = lowStock.slice(0, 3).map((r) => `${r.name} (${r.stock}/${r.reorder_level})`).join(', ');
      await createAlert({
        type: 'WARNING',
        module: 'Inventory',
        title: 'Low Stock Alert',
        message: `${lowStock.length} product(s) are at or below their reorder level — e.g. ${top}. Restocking required.`,
        relatedRecordId: lowStock[0].id,
        relatedModule: 'product',
        fingerprint: 'low-stock',
      });
    } else {
      await autoResolve('low-stock');
    }
  } catch (e) { /* skip */ }

  // ── WARNING · Inventory (expiring within 30 days) ──
  try {
    const expiring = await db('products')
      .whereNotNull('expiry_date')
      .whereRaw('DATEDIFF(expiry_date, CURDATE()) > 0')
      .whereRaw('DATEDIFF(expiry_date, CURDATE()) <= 30')
      .select('id', 'name', 'expiry_date')
      .orderBy('expiry_date', 'asc');
    if (expiring.length > 0) {
      const top = expiring.slice(0, 3).map((r) => `${r.name} (${String(r.expiry_date).slice(0, 10)})`).join(', ');
      await createAlert({
        type: 'WARNING',
        module: 'Inventory',
        title: 'Products Expiring Soon',
        message: `${expiring.length} product(s) expire within 30 days — e.g. ${top}. Plan clearance before expiry.`,
        relatedRecordId: expiring[0].id,
        relatedModule: 'product',
        fingerprint: 'expiring-soon',
      });
    } else {
      await autoResolve('expiring-soon');
    }
  } catch (e) { /* skip */ }

  // ── CRITICAL · Finance (payment overdue) ──
  try {
    const overdue = await db('finance_supplier_bills')
      .whereNotNull('due_date')
      .whereRaw('due_date < CURDATE()')
      .whereRaw('amount_paid < total_amount')
      .select('id', 'bill_number', 'supplier_name', 'due_date', 'total_amount', 'amount_paid');
    if (overdue.length > 0) {
      const top = overdue.slice(0, 3).map((r) => r.supplier_name || r.bill_number).join(', ');
      await createAlert({
        type: 'CRITICAL',
        module: 'Finance',
        title: 'Overdue Supplier Payments',
        message: `${overdue.length} supplier payment(s) are overdue and unpaid — e.g. ${top}. Settle them immediately.`,
        relatedRecordId: overdue[0].id,
        relatedModule: 'supplier_bill',
        fingerprint: 'overdue-supplier-payments',
      });
    } else {
      await autoResolve('overdue-supplier-payments');
    }
  } catch (e) { /* skip */ }

  // ── WARNING · Finance (supplier payment due soon) ──
  try {
    const dueSoon = await db('finance_supplier_bills')
      .whereNotNull('due_date')
      .whereRaw('due_date >= CURDATE()')
      .whereRaw('due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)')
      .whereRaw('amount_paid < total_amount')
      .select('id', 'bill_number', 'supplier_name', 'due_date', 'total_amount', 'amount_paid');
    if (dueSoon.length > 0) {
      const top = dueSoon.slice(0, 3).map((r) => r.supplier_name || r.bill_number).join(', ');
      await createAlert({
        type: 'WARNING',
        module: 'Finance',
        title: 'Supplier Payment Due',
        message: `${dueSoon.length} supplier payment(s) are due within the next 7 days — e.g. ${top}. Schedule payment before due date.`,
        relatedRecordId: dueSoon[0].id,
        relatedModule: 'supplier_bill',
        fingerprint: 'supplier-payments-due',
      });
    } else {
      await autoResolve('supplier-payments-due');
    }
  } catch (e) { /* skip */ }

  // ── WARNING · Security (pending approvals) ──
  try {
    const pending = await db('expense_approval_requests')
      .where('status', 'pending')
      .count('* as count').first();
    await syncStateAlert({
      active: parseInt(pending.count) > 0,
      type: 'WARNING',
      module: 'Security',
      title: 'Pending Approvals',
      message: `${parseInt(pending.count)} expense approval request(s) are waiting for a decision. Review them soon.`,
      fingerprint: 'pending-approvals',
    });
  } catch (e) { /* skip */ }

  // ── WARNING · System (high memory) ──
  try {
    const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    await syncStateAlert({
      active: memUsage > 85,
      type: 'WARNING',
      module: 'System',
      title: 'High Memory Usage',
      message: `Memory usage is at ${memUsage.toFixed(1)}%. System performance may degrade — investigate before it becomes critical.`,
      fingerprint: 'high-memory',
    });
  } catch (e) { /* skip */ }

  // ── INFO · System (backup success) ──
  try {
    const backup = await db('settings').where('setting_key', 'last_backup_status').first();
    if (backup && backup.setting_value === 'success') {
      await createAlert({
        type: 'INFO',
        module: 'System',
        title: 'Backup Completed Successfully',
        message: 'The most recent scheduled backup completed successfully.',
        fingerprint: 'backup-success',
      });
    }
  } catch (e) { /* skip */ }

  // ── INFO · Sales (sales completed today) ──
  try {
    const sales = await db('sales')
      .where('status', 'COMPLETED')
      .whereRaw('DATE(created_at) = CURDATE()')
      .count('* as count').first();
    if (parseInt(sales.count) > 0) {
      await createAlert({
        type: 'INFO',
        module: 'Sales',
        title: 'New Sales Completed',
        message: `${parseInt(sales.count)} sale(s) were completed today.`,
        fingerprint: `sales-today-${todayKey()}`,
      });
    }
  } catch (e) { /* skip */ }

  // ── INFO · Finance (payments received today) ──
  try {
    const payments = await db('payments')
      .whereRaw('DATE(created_at) = CURDATE()')
      .count('* as count').first();
    if (parseInt(payments.count) > 0) {
      await createAlert({
        type: 'INFO',
        module: 'Finance',
        title: 'Payments Received',
        message: `${parseInt(payments.count)} payment(s) were received today.`,
        fingerprint: `payments-today-${todayKey()}`,
      });
    }
  } catch (e) { /* skip */ }

  // ── INFO · HR (new users created today) ──
  try {
    const users = await db('users')
      .whereRaw('DATE(created_at) = CURDATE()')
      .count('* as count').first();
    if (parseInt(users.count) > 0) {
      await createAlert({
        type: 'INFO',
        module: 'HR',
        title: 'New Users Created',
        message: `${parseInt(users.count)} new user account(s) were created today.`,
        fingerprint: `new-users-${todayKey()}`,
      });
    }
  } catch (e) { /* skip */ }

  // ── WARNING · System (storage usage high) ──
  try {
    const sizeRow = await db.raw(
      "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS size_mb FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    const sizeMb = parseFloat(sizeRow[0][0].size_mb) || 0;
    await syncStateAlert({
      active: sizeMb > 1500,
      type: 'WARNING',
      module: 'System',
      title: 'High Storage Usage',
      message: `Database is using ${sizeMb.toFixed(0)} MB of storage. Plan a cleanup/archive before space runs low.`,
      fingerprint: 'high-storage',
    });
  } catch (e) { /* skip */ }
}

/* ─────────────────────────────────────────────
   Visibility: an alert is shown when it targets
   no one (global), targets the current user, or
   targets a role the current user holds. Super users
   (Admin/CEO/Board) always see role-targeted alerts.
   ───────────────────────────────────────────── */
const isVisibleTo = (alert, user) => {
  const roles = (user.roles || [])
    .map((r) => (typeof r === 'string' ? r : r.name || r))
    .map((r) => String(r).toLowerCase());
  if (alert.target_user_id) return Number(alert.target_user_id) === Number(user.id);
  if (alert.target_role) {
    const target = String(alert.target_role).toLowerCase();
    if (roles.includes(target)) return true;
    return roles.some((r) => ['admin', 'ceo', 'board'].includes(r));
  }
  return true;
};

const listAlerts = async (user, { status, module } = {}) => {
  await ensureAlertsTable();
  let query = db('alerts');
  if (status) query = query.where('status', String(status).toUpperCase());
  if (module) query = query.where('module', module);
  const all = await query.orderByRaw('priority ASC, created_at DESC');
  const visible = all.filter((a) => isVisibleTo(a, user));
  return {
    alerts: visible,
    total: visible.length,
    unread: visible.filter((a) => a.status === 'UNREAD').length,
  };
};

const getUnreadCount = async (user) => {
  await ensureAlertsTable();
  const all = await db('alerts').where('status', 'UNREAD');
  return all.filter((a) => isVisibleTo(a, user)).length;
};

const updateStatus = async (id, status, user) => {
  await ensureAlertsTable();
  const alert = await db('alerts').where('id', id).first();
  if (!alert || !isVisibleTo(alert, user)) return false;
  await db('alerts').where('id', id).update({ status });
  return true;
};

module.exports = {
  syncAlerts,
  createAlert,
  listAlerts,
  getUnreadCount,
  updateStatus,
};
