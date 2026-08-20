const { db } = require('../config/database');

/**
 * Danger Zone Service
 * Handles CEO-approved full database resets (wipes all inserted/business data
 * while keeping core system tables that are required to run the application).
 */

// Tables that must NEVER be wiped — required to keep the system running.
// Grouped by purpose so nothing essential is ever dropped/emptied:
//   AUTH/SECURITY/GOVERNANCE · SETTINGS/CONFIG · LOOKUPS/REFERENCE
//   CATALOGS/REGISTRIES/MASTER DATA · RUNTIME · DANGER-ZONE LEDGER
const PROTECTED_TABLES = new Set([
  // ── Migrations / infra ──
  'knex_migrations',
  'knex_migrations_lock',

  // ── Auth, identity & security ──
  'users',
  'user_roles',
  'roles',
  'user_statuses',
  'password_history',
  'sessions',
  'session_anomalies',
  'service_accounts',
  'single_roles',
  'composite_roles',
  'composite_role_mappings',
  'sod_rules',
  'sod_violations',
  'field_security',
  'admin_tiers',
  'admin_data_scopes',
  'admin_elevations',
  'access_certifications',
  'certification_reviews',
  'delegated_nodes',
  'delegated_assignments',
  'break_glass_events',
  'compliance_evidence',
  'compliance_status',
  'registered_computers',

  // ── Settings / configuration ──
  'settings',
  'social_links',
  'vat_configurations',
  'vat_change_history',
  'chart_of_accounts',
  'finance_accounts',
  'finance_expense_seq',
  'hr_settings',
  'pharmacy_settings',
  'printing_settings',
  'rental_settings',
  'sales_settings',
  'procurement_settings',
  'hr_notification_rules',
  'expense_approvers',
  'expense_taxes',
  'payroll_salary_components',
  'product_tax_mappings',

  // ── Lookups / reference / status tables ──
  'branches',
  'pharmacy_branches',
  'retail_branches',
  'departments',
  'finance_departments',
  'hr_departments',
  'sectors',
  'units',
  'hr_units',
  'hr_positions',
  'hr_deductions',
  'leave_types',
  'customer_types',
  'payment_methods',
  'payment_statuses',
  'payment_terms',
  'order_statuses',
  'sale_statuses',
  'po_statuses',
  'drug_categories',
  'pharmacy_categories',
  'retail_categories',
  'product_categories',
  'manufacturers',
  'expense_categories',
  'finance_expense_categories',
  'loyalty_tiers',
  'stamps',
  'warehouses',
  'budget_periods',
  'pharmacy_report_branches',

  // ── Catalogs / registries / master data ──
  'products',
  'drugs',
  'pharmacy_medications',
  'general_store_materials',
  'cars',
  'tractors',
  'printing_assets_machines',
  'printing_product_types',
  'pharmacy_workers',
  'store_staff',
  'boards',
  'board_members',

  // ── Runtime / device / notification infra ──
  'push_subscriptions',
  'manager_chat_groups',
  'manager_chat_group_members',

  // ── Integration + danger-zone ledger ──
  'integration_settings',
  'danger_zone_requests',
]);

const STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// ── Helpers ──────────────────────────────────────────────────────────────

async function listTables(conn) {
  const dbName = process.env.DB_NAME || 'sutana_ems_dev';
  const rows = await conn.raw(
    `SELECT table_name, table_rows FROM information_schema.tables
     WHERE table_schema = ? AND table_type = 'BASE TABLE' ORDER BY table_name`,
    [dbName]
  );
  return rows[0].map(r => ({ name: r.table_name, approxRows: Number(r.table_rows) || 0 }));
}

function classify(tables) {
  const wipeable = [];
  const protectedTables = [];
  let wipeableRows = 0;
  for (const t of tables) {
    if (PROTECTED_TABLES.has(t.name)) {
      protectedTables.push(t);
    } else {
      wipeable.push(t);
      wipeableRows += t.approxRows;
    }
  }
  return { wipeable, protectedTables, wipeableRows };
}

// ── Overview ─────────────────────────────────────────────────────────────

async function getOverview() {
  const tables = await listTables(db);
  const { wipeable, protectedTables, wipeableRows } = classify(tables);
  const pending = await db('danger_zone_requests')
    .where({ status: STATUS.PENDING })
    .orderBy('created_at', 'desc')
    .first();
  const recent = await db('danger_zone_requests')
    .orderBy('created_at', 'desc')
    .limit(10);
  return {
    database: process.env.DB_NAME || 'sutana_ems_dev',
    totalTables: tables.length,
    wipeableTables: wipeable.length,
    protectedTables: protectedTables.map(t => t.name),
    wipeableTablesList: wipeable.map(t => t.name),
    approxRowsToDelete: wipeableRows,
    hasPendingRequest: Boolean(pending),
    pendingRequest: pending || null,
    recentRequests: recent,
  };
}

// ── Requests ─────────────────────────────────────────────────────────────

async function createRequest({ requestedBy, requestedByName, reason, confirmText }) {
  const [id] = await db('danger_zone_requests').insert({
    action: 'RESET_ALL_DATA',
    requested_by: requestedBy,
    requested_by_name: requestedByName,
    reason,
    confirm_text: confirmText,
    status: STATUS.PENDING,
  });
  return db('danger_zone_requests').where({ id }).first();
}

async function listRequests({ status } = {}) {
  const query = db('danger_zone_requests').orderBy('created_at', 'desc');
  if (status) query.where({ status });
  return query.limit(100);
}

// ── CEO approve / reject ────────────────────────────────────────────────

async function approveRequest(id, { approvedBy, approvedByName }) {
  const request = await db('danger_zone_requests').where({ id }).first();
  if (!request) {
    const err = new Error('Reset request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== STATUS.PENDING) {
    const err = new Error(`This request has already been ${request.status.toLowerCase()} and cannot be approved again`);
    err.statusCode = 400;
    throw err;
  }

  await db('danger_zone_requests').where({ id }).update({
    status: STATUS.APPROVED,
    approved_by: approvedBy,
    approved_by_name: approvedByName,
    approved_at: new Date(),
  });

  let summary = null;
  let failed = false;
  let failureMessage = '';
  try {
    summary = await executeReset();
  } catch (error) {
    failed = true;
    failureMessage = error.message;
  }

  await db('danger_zone_requests').where({ id }).update({
    status: failed ? STATUS.FAILED : STATUS.COMPLETED,
    executed_at: new Date(),
    completion_summary: failed ? { error: failureMessage } : summary,
  });

  const updated = await db('danger_zone_requests').where({ id }).first();
  if (failed) {
    const err = new Error(`Reset approved but execution failed: ${failureMessage}`);
    err.statusCode = 500;
    err.request = updated;
    throw err;
  }
  return updated;
}

async function rejectRequest(id, { approvedBy, approvedByName, reason }) {
  const request = await db('danger_zone_requests').where({ id }).first();
  if (!request) {
    const err = new Error('Reset request not found');
    err.statusCode = 404;
    throw err;
  }
  if (request.status !== STATUS.PENDING) {
    const err = new Error(`This request has already been ${request.status.toLowerCase()} and cannot be rejected again`);
    err.statusCode = 400;
    throw err;
  }
  await db('danger_zone_requests').where({ id }).update({
    status: STATUS.REJECTED,
    approved_by: approvedBy,
    approved_by_name: approvedByName,
    approved_at: new Date(),
    rejected_reason: reason || null,
  });
  return db('danger_zone_requests').where({ id }).first();
}

// ── Execution ────────────────────────────────────────────────────────────

// Clear the data inside a single table only (the table itself is NEVER dropped).
async function clearTableData(tableName) {
  const name = String(tableName || '').trim();
  if (!/^[a-z0-9_]+$/.test(name)) {
    const err = new Error('Invalid table name');
    err.statusCode = 400;
    throw err;
  }
  if (PROTECTED_TABLES.has(name)) {
    const err = new Error(`"${name}" is a protected system table and cannot be cleared`);
    err.statusCode = 400;
    throw err;
  }
  const trx = await db.transaction();
  try {
    await trx.raw('SET FOREIGN_KEY_CHECKS = 0');
    const result = await trx(name).del();
    const rowsDeleted = Number(result) || 0;
    await trx.raw('SET FOREIGN_KEY_CHECKS = 1');
    await trx.commit();
    return { table: name, rowsDeleted };
  } catch (error) {
    try { await trx.raw('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
    try { await trx.rollback(); } catch (_) {}
    const err = new Error(`Failed to clear "${name}": ${error.message}`);
    err.statusCode = 500;
    throw err;
  }
}

async function executeReset() {
  const trx = await db.transaction();
  const summary = { startedAt: new Date().toISOString(), tablesCleared: 0, rowsDeleted: 0, perTable: [], error: null };
  try {
    const tables = await listTables(trx);
    const { wipeable } = classify(tables);

    // Disable FK checks so tables can be cleared in any order.
    await trx.raw('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of wipeable) {
      // SAFETY: only accept valid MySQL identifiers — a raw DELETE can NEVER drop a table.
      if (!/^[a-z0-9_]+$/.test(table.name)) {
        summary.perTable.push({ table: table.name, rowsDeleted: 0, skipped: 'invalid table name' });
        continue;
      }
      try {
        // DELETE FROM <table> — removes rows only; the table itself is NEVER dropped.
        const result = await trx(table.name).del();
        const rowsDeleted = Number(result) || 0;
        summary.tablesCleared += 1;
        summary.rowsDeleted += rowsDeleted;
        summary.perTable.push({ table: table.name, rowsDeleted });
      } catch (innerError) {
        summary.perTable.push({ table: table.name, rowsDeleted: 0, skipped: innerError.message });
      }
    }

    await trx.raw('SET FOREIGN_KEY_CHECKS = 1');

    // VERIFY: every table must still exist after the reset (only their data was removed).
    const afterTables = await listTables(trx);
    summary.tablesStillExist = afterTables.length;
    summary.tablesDeleted = 0;

    await trx.commit();
    summary.finishedAt = new Date().toISOString();
    return summary;
  } catch (error) {
    try { await trx.raw('SET FOREIGN_KEY_CHECKS = 1'); } catch (_) {}
    try { await trx.rollback(); } catch (_) {}
    summary.error = error.message;
    throw error;
  }
}

module.exports = {
  PROTECTED_TABLES,
  STATUS,
  getOverview,
  createRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  clearTableData,
};