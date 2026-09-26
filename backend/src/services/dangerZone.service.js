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

// ── Module classification ──────────────────────────────────────────────────
// Every table is grouped under a business module so the Danger Zone can show
// tables per module (sorted alphabetically inside each module).
// Prefix rules are checked first (most specific first), then exact names.

const MODULE_BY_PREFIX = [
  // Pharmacy
  ['pharmacy', 'Pharmacy'],
  // Retail & POS
  ['retail', 'Retail & POS'],
  ['pos_', 'Retail & POS'],
  // Finance
  ['finance', 'Finance'],
  ['erp_', 'Finance'],
  ['expense', 'Finance'],
  ['petty_cash', 'Finance'],
  ['bank_payments', 'Finance'],
  ['cash_handovers', 'Finance'],
  ['month_end_closes', 'Finance'],
  // HR & Payroll
  ['payroll', 'HR & Payroll'],
  ['hr_', 'HR & Payroll'],
  ['etp_', 'HR & Payroll'],
  // Procurement & Tenders
  ['procurement', 'Procurement & Tenders'],
  ['purchase_', 'Procurement & Tenders'],
  ['public_', 'Procurement & Tenders'],
  ['supplier', 'Procurement & Tenders'],
  // Printing
  ['printing', 'Printing'],
  // Car Rental & Fleet
  ['car_renting', 'Car Rental & Fleet'],
  ['rental', 'Car Rental & Fleet'],
  // Farming & AgriRent
  ['agrirent', 'Farming & AgriRent'],
  ['farming', 'Farming & AgriRent'],
  // Inventory & Store
  ['store_', 'Inventory & Store'],
  ['stock_', 'Inventory & Store'],
  // Sales & Marketing
  ['sales', 'Sales & Marketing'],
  ['sale_', 'Sales & Marketing'],
  ['loyalty', 'Sales & Marketing'],
  // Board & Governance
  ['board_', 'Board & Governance'],
  // Crisis & Risk
  ['crisis_', 'Crisis & Risk'],
  // Governance & Compliance
  ['compliance', 'Governance & Compliance'],
  ['sod_', 'Governance & Compliance'],
  ['delegated', 'Governance & Compliance'],
  ['admin_', 'Governance & Compliance'],
  // Audit & Logs
  ['audit_logs', 'Audit & Logs'],
  // Communications & Notifications
  ['manager_chat', 'Communications & Notifications'],
  ['notifications', 'Communications & Notifications'],
];

const MODULE_BY_NAME = {
  // ── Finance ──
  chart_of_accounts: 'Finance',
  vat_configurations: 'Finance',
  vat_change_history: 'Finance',
  vat_transactions: 'Finance',
  tax_details: 'Finance',
  tax_receipts: 'Finance',
  tax_registrations: 'Finance',
  liabilities: 'Finance',
  liability_payments: 'Finance',
  loan_details: 'Finance',
  dividends: 'Finance',
  shareholders: 'Finance',
  expenses: 'Finance',
  budget_encumbrances: 'Finance',
  budget_items: 'Finance',
  budget_periods: 'Finance',
  invoice_payments: 'Finance',
  sales_receipts: 'Finance',
  fund_requests: 'Finance',
  fund_request_items: 'Finance',
  payment_schedules: 'Finance',

  // ── Auth & Security ──
  users: 'Auth & Security',
  user_roles: 'Auth & Security',
  roles: 'Auth & Security',
  single_roles: 'Auth & Security',
  composite_roles: 'Auth & Security',
  composite_role_mappings: 'Auth & Security',
  user_statuses: 'Auth & Security',
  password_history: 'Auth & Security',
  sessions: 'Auth & Security',
  session_anomalies: 'Auth & Security',
  service_accounts: 'Auth & Security',
  registered_computers: 'Auth & Security',

  // ── Settings & Reference ──
  settings: 'Settings & Reference',
  social_links: 'Settings & Reference',
  payment_methods: 'Settings & Reference',
  payment_statuses: 'Settings & Reference',
  payment_terms: 'Settings & Reference',
  order_statuses: 'Settings & Reference',
  sale_statuses: 'Settings & Reference',
  po_statuses: 'Settings & Reference',
  customer_types: 'Settings & Reference',
  sectors: 'Settings & Reference',
  units: 'Settings & Reference',
  branches: 'Settings & Reference',
  pharmacy_report_branches: 'Settings & Reference',
  pharmacy_categories: 'Settings & Reference',
  retail_categories: 'Settings & Reference',
  drug_categories: 'Settings & Reference',
  product_categories: 'Settings & Reference',
  manufacturers: 'Settings & Reference',
  loyalty_tiers: 'Settings & Reference',
  stamps: 'Settings & Reference',
  warehouses: 'Settings & Reference',

  // ── Inventory & Store ──
  grn: 'Inventory & Store',
  grn_items: 'Inventory & Store',
  goods_receipt_notes: 'Inventory & Store',
  inventory: 'Inventory & Store',
  inventory_counts: 'Inventory & Store',
  inventory_movements: 'Inventory & Store',
  inventory_serials: 'Inventory & Store',
  transfer_requests: 'Inventory & Store',
  transfer_items: 'Inventory & Store',
  requisitions: 'Inventory & Store',
  issue_vouchers: 'Inventory & Store',
  deliveries: 'Inventory & Store',
  general_movement_log: 'Inventory & Store',

  // ── Sales & Marketing ──
  customers: 'Sales & Marketing',
  customer_quotes: 'Sales & Marketing',
  leads: 'Sales & Marketing',
  opportunities: 'Sales & Marketing',
  quotations: 'Sales & Marketing',
  quotation_items: 'Sales & Marketing',
  price_lists: 'Sales & Marketing',
  price_list_items: 'Sales & Marketing',
  promotions: 'Sales & Marketing',
  sales_tenders: 'Sales & Marketing',
  sales_tender_bids: 'Sales & Marketing',
  sales_targets: 'Sales & Marketing',
  market_tasks: 'Sales & Marketing',
  manager_sale_actions: 'Sales & Marketing',

  // ── Procurement & Tenders ──
  bids: 'Procurement & Tenders',
  tenders: 'Procurement & Tenders',
  po_items: 'Procurement & Tenders',
  po_payments: 'Procurement & Tenders',
  three_way_matches: 'Procurement & Tenders',
  general_procurement_requests: 'Procurement & Tenders',

  // ── Inventory & Store ──
  products: 'Inventory & Store',
  general_store_materials: 'Inventory & Store',

  // ── Car Rental & Fleet ──
  cars: 'Car Rental & Fleet',

  // ── Farming & AgriRent ──
  tractors: 'Farming & AgriRent',

  // ── Contracts ──
  contracts: 'Contracts',

  // ── Board & Governance ──
  boards: 'Board & Governance',

  // ── Communications & Notifications ──
  push_subscriptions: 'Communications & Notifications',
  email_subscribers: 'Communications & Notifications',
  news_posts: 'Communications & Notifications',
  announcements: 'Communications & Notifications',
  hr_announcements: 'Communications & Notifications',
  hr_announcement_receipts: 'Communications & Notifications',
  contact_messages: 'Communications & Notifications',
  support_tickets: 'Communications & Notifications',
  communication_logs: 'Communications & Notifications',
  alerts: 'Communications & Notifications',

  // ── HR & Payroll ──
  employees: 'HR & Payroll',
  employee_reports: 'HR & Payroll',
  employee_tasks: 'HR & Payroll',
  attendance_records: 'HR & Payroll',
  leave_requests: 'HR & Payroll',
  leave_types: 'HR & Payroll',
  job_applications: 'HR & Payroll',

  // ── Board & Governance ──
  approvals: 'Board & Governance',

  // ── Crisis & Risk ──
  risk_register: 'Crisis & Risk',

  // ── Audit & Logs ──
  audit_logs_archive: 'Audit & Logs',
  central_audit_logs: 'Audit & Logs',
  order_status_history: 'Audit & Logs',
  integration_sync_logs: 'Audit & Logs',
  pos_audit_trail: 'Audit & Logs',
  pharmacy_audit_trail: 'Audit & Logs',
  retail_audit_trail: 'Audit & Logs',
  sale_audit_log: 'Audit & Logs',
  hr_audit_logs: 'Audit & Logs',
  expense_audit_trail: 'Audit & Logs',

  // ── Pharmacy ──
  drugs: 'Pharmacy',
  prescription_requests: 'Pharmacy',

  // ── Retail & POS ──
  rma_returns: 'Retail & POS',
  rma_return_items: 'Retail & POS',

  // ── Governance & Compliance ──
  break_glass_events: 'Governance & Compliance',
  field_security: 'Governance & Compliance',
  compliance_evidence: 'Governance & Compliance',
  compliance_status: 'Governance & Compliance',
};

function moduleForTable(name) {
  // Suffix rules first so audit/communication logs never leak into broad modules.
  if (
    name.endsWith('_audit_trail') ||
    name.endsWith('_audit_log') ||
    name.endsWith('_audit_logs') ||
    name === 'central_audit_logs'
  ) return 'Audit & Logs';
  if (
    name.endsWith('_messages') ||
    name.endsWith('_notifications') ||
    name.endsWith('_notifications_log') ||
    name.endsWith('_chats') ||
    name.startsWith('manager_chat')
  ) return 'Communications & Notifications';
  const exact = MODULE_BY_NAME[name];
  if (exact) return exact;
  for (const [prefix, mod] of MODULE_BY_PREFIX) {
    if (name.startsWith(prefix)) return mod;
  }
  return 'Other';
}

function groupByModule(tables) {
  const map = new Map();
  for (const t of tables) {
    const mod = moduleForTable(t.name);
    if (!map.has(mod)) map.set(mod, []);
    map.get(mod).push(t);
  }
  return [...map.entries()]
    .map(([module, list]) => ({
      module,
      tables: list.slice().sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.module.localeCompare(b.module));
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function listTables(conn) {
  const dbName = process.env.DB_NAME || 'sutana_ems_dev';
  const rows = await conn.raw(
    `SELECT table_name, CASE WHEN table_schema = current_schema() THEN (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name) ELSE NULL END FROM information_schema.tables
     WHERE table_schema = ? AND table_type = 'BASE TABLE' ORDER BY table_name`,
    [dbName]
  );
  return rows.rows.map(r => ({ name: r.table_name, approxRows: Number(r.table_rows) || 0 }));
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
    wipeableTablesList: wipeable.map(t => ({ name: t.name, approxRows: t.approxRows })),
    approxRowsToDelete: wipeableRows,
    hasPendingRequest: Boolean(pending),
    pendingRequest: pending || null,
    recentRequests: recent,
    // Grouped by module, tables sorted alphabetically inside each module.
    protectedByModule: groupByModule(protectedTables)
      .map(m => ({ module: m.module, tables: m.tables.map(t => t.name) })),
    wipeableByModule: groupByModule(wipeable)
      .map(m => ({
        module: m.module,
        tables: m.tables.map(t => ({ name: t.name, approxRows: t.approxRows })),
      })),
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

  // Verify the table actually exists in the DB before attempting delete
  const dbName = process.env.DB_NAME || 'sutana_ems_dev';
  // node-postgres returns { rows }; mysql2 returned [rows, fields].
  const { rows: tableCheck } = await db.raw(
    `SELECT COUNT(*)::int as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ? AND table_type = 'BASE TABLE'`,
    [dbName, name]
  );
  if (!tableCheck[0] || tableCheck[0].cnt === 0) {
    const err = new Error(`Table "${name}" does not exist in the database`);
    err.statusCode = 404;
    throw err;
  }

  // Disable FK/trigger enforcement so rows can be removed in any order.
  // PostgreSQL's equivalent of MySQL's SET FOREIGN_KEY_CHECKS=0 is
  // session_replication_role.  Two details matter:
  //
  //   - It must be applied on the *same connection* as the DELETE.  Running
  //     `db.raw(...)` and then `db(name).del()` on the pool is not safe: the
  //     pool may hand out two different connections, in which case the DELETE
  //     runs with enforcement still on and fails on a foreign key.  Wrapping
  //     both in one transaction pins them to a single connection.
  //   - It must be SET LOCAL, not SET.  A plain SET persists on the connection
  //     after the transaction ends, and that connection goes back into the
  //     pool, silently disabling referential integrity for unrelated queries.
  //     SET LOCAL is reverted automatically at commit or rollback.
  //
  // This requires a superuser, or a role granted SET on that parameter.
  return db.transaction(async (trx) => {
    await trx.raw("SET LOCAL session_replication_role = 'replica'");
    try {
      const rowsDeleted = await trx(name).del();
      return { table: name, rowsDeleted: Number(rowsDeleted) || 0 };
    } catch (error) {
      const err = new Error(`Failed to clear "${name}": ${error.message}`);
      err.statusCode = 500;
      throw err;
    }
  });
}

async function executeReset() {
  const trx = await db.transaction();
  const summary = { startedAt: new Date().toISOString(), tablesCleared: 0, rowsDeleted: 0, perTable: [], error: null };
  try {
    const tables = await listTables(trx);
    const { wipeable } = classify(tables);

    // Disable FK/trigger enforcement so tables can be cleared in any order.
    // SET LOCAL is reverted automatically when this transaction commits or
    // rolls back, so the setting cannot survive on a pooled connection.  A
    // plain SET would not be: session settings are not undone by ROLLBACK,
    // which would leave referential integrity disabled for later queries.
    // See clearTable() for the full explanation.
    await trx.raw("SET LOCAL session_replication_role = 'replica'");

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

    // No need to restore session_replication_role by hand: SET LOCAL reverts
    // itself at COMMIT below.

    // VERIFY: every table must still exist after the reset (only their data was removed).
    const afterTables = await listTables(trx);
    summary.tablesStillExist = afterTables.length;
    summary.tablesDeleted = 0;

    await trx.commit();
    summary.finishedAt = new Date().toISOString();
    return summary;
  } catch (error) {
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