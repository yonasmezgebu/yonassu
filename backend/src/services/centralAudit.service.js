const { db } = require('../config/database');

/**
 * Creates a new central audit log.
 * @param {Object} data - Audit log payload
 */
const createLog = async (data) => {
  try {
    await db('central_audit_logs').insert({
      user_id: data.userId || null,
      user_name: data.userName || 'System',
      role: data.role || 'Unknown',
      department: data.department || 'Unknown',
      module: data.module,
      action: data.action,
      record_identifier: data.recordIdentifier || null,
      previous_value: data.previousValue ? JSON.stringify(data.previousValue) : null,
      new_value: data.newValue ? JSON.stringify(data.newValue) : null,
      ip_address: data.ipAddress || null,
    });
  } catch (error) {
    console.error('Failed to write to central audit log:', error);
  }
};

/* ─────────────────────────────────────────────────────────────
   Legacy bridge — mirrors the old `audit()` helper writes into
   the central table so every dashboard/module shows up on the
   Central Audit Log page. Always non-blocking; failures are
   swallowed so audit can never break a real request.
   ───────────────────────────────────────────────────────────── */
const MODULE_PREFIX_MAP = [
  { re: /^HR_/, module: 'HR' },
  { re: /^(EXPENSE|FINANCE|BUDGET|COA_|PO_|INVOICE|PAYMENT|BANK_|PETTY_CASH|APPROVER_|ACCOUNT_|MONTH_END)/, module: 'Finance' },
  { re: /PHARMACY|MEDICINE|DRUG|PHARM_/, module: 'Pharmacy' },
  { re: /^(STORE_)/, module: 'Pharmacy Store' },
  { re: /^(INVENTORY|PRODUCT|STOCK|CATEGORY|DAMAGED_ITEMS|LOST_ITEMS|WAREHOUSE)/, module: 'Inventory' },
  { re: /^(STORE|STORE_QUANTITY_UPDATE|STORE_VALUE_UPDATE|STORE_MATERIAL_UPDATE|REQUISITION|ITEMS_ISSUED|GRN_|GOODS_|ISSUE_|RECEIV)/, module: 'Store' },
  { re: /^(PURCHASE|TENDER|BID_|SUPPLIER|VENDOR_|PROCUREMENT)/, module: 'Procurement' },
  { re: /^(SALE|ORDER|QUOTE|CUSTOMER|CART_|POS_|SUPPORT_)/, module: 'Sales' },
  { re: /^(PRINTING|TAX_RECEIPT)/, module: 'Printing' },
  { re: /^(MACHINE|TRACTOR|VEHICLE|RENTAL|CAR_)/, module: 'Store' },
  { re: /^CEO_/, module: 'CEO' },
  { re: /^(USER|ROLE|LOGIN|LOGOUT|PASSWORD|2FA|TOKEN|SESSION|SETTING|BACKUP|CACHE|AUDIT|DATABASE|ADMIN|BREAK_GLASS|ELEVATION|SOD_|CERTIFICATION|DORMANT|SINGLE_ROLE|COMPOSITE_ROLE|SERVICE_ACCOUNT|FIELD_SENSITIVITY|DELEGATED_ADMIN|EVIDENCE_|DR_TEST|UNAUTHORIZED|INVALID_API_KEY)/, module: 'Admin' },
];

const mapModule = (action, details = {}) => {
  if (details.module) return details.module;
  const name = String(action || '').toUpperCase();
  for (const { re, module } of MODULE_PREFIX_MAP) {
    if (re.test(name)) return module;
  }
  return 'General';
};

const IDENTIFIER_KEYS = ['title', 'id', 'reqNo', 'grnNo', 'issNo', 'name', 'email', 'orderId', 'employeeId', 'productId', 'vendorName', 'accountCode', 'tenderId', 'poId'];
const pickIdentifier = (details = {}) => {
  if (details.recordIdentifier != null) return String(details.recordIdentifier);
  
  // Try to find a meaningful name before falling back to an ID
  const statesToSearch = [details.afterState, details.beforeState, details.details, details.newValue, details.previousValue];
  for (const obj of statesToSearch) {
    if (obj && typeof obj === 'object') {
      if (obj.title) return String(obj.title);
      if (obj.name) return String(obj.name);
      if (obj.employee_name) return String(obj.employee_name);
    }
  }

  if (details.resourceId != null) return String(details.resourceId);
  const d = details.details;
  if (d && typeof d === 'object') {
    for (const k of IDENTIFIER_KEYS) {
      if (d[k] != null) return String(d[k]);
    }
  }
  return null;
};

let centralTableChecked = false;
let centralTableReady = false;
const ensureCentralTable = async () => {
  if (centralTableChecked) return centralTableReady;
  centralTableChecked = true;
  try {
    centralTableReady = await db.schema.hasTable('central_audit_logs');
  } catch (e) {
    centralTableReady = false;
  }
  return centralTableReady;
};

/* Short in-memory dedup: the global audit middleware and controllers that
   already call `audit()` can both fire for the same request. Collapse
   identical (user, module, action, recordIdentifier, ip) writes within 3s —
   the action is part of the key so two different actions on the same record
   (e.g. order created then immediately status-updated) are never collapsed. */
const recentCentralWrites = new Map();
const CENTRAL_DEDUP_MS = 3000;
const dedupKey = (userId, action, details) =>
  `${userId || ''}|${mapModule(action, details)}|${String(action || '')}|${pickIdentifier(details) || ''}|${details.ip || ''}`;

const captureLegacy = async (action, userId, details = {}) => {
  try {
    if (details.centralAudit === false) return;
    if (!(await ensureCentralTable())) return;
    const fprint = dedupKey(userId, action, details);
    const now = Date.now();
    const lastWrite = recentCentralWrites.get(fprint);
    if (lastWrite && now - lastWrite < CENTRAL_DEDUP_MS) return;
    recentCentralWrites.set(fprint, now);
    if (recentCentralWrites.size > 1000) {
      for (const [k, t] of recentCentralWrites) {
        if (now - t > 60000) recentCentralWrites.delete(k);
      }
    }
    let userName = details.userName || details.user_name || null;
    let role     = details.role || null;
    let dept     = details.department || null;
    if (userId) {
      const u = await db('users')
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .select(
          'users.full_name',
          db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'),
          'departments.name as department_name'
        )
        .where('users.id', userId)
        .whereNull('users.deleted_at')
        .groupBy('users.full_name', 'departments.name')
        .first();
      if (u) {
        userName = u.full_name || userName;
        role     = u.role_names || role;
        dept     = u.department_name || dept;
      }
    }
    const resolvedIdentifier = pickIdentifier(details) || details.description || null;
    
    let finalAction = String(action || 'ACTION');
    if (details.resource === 'employee-tasks') {
      if (finalAction === 'CREATE') finalAction = 'EMPLOYEE_TASK_ASSIGNED';
      if (finalAction === 'UPDATE') finalAction = 'EMPLOYEE_TASK_UPDATED';
      if (finalAction === 'DELETE') finalAction = 'EMPLOYEE_TASK_DELETED';
    } else if (details.resource === 'employee-reports') {
      if (finalAction === 'CREATE') finalAction = 'EMPLOYEE_REPORT_SUBMITTED';
    } else {
      // Generic CRUD → descriptive pharmacy/medicine actions based on resource path
      const res = String(details.resource || details.path || '').toLowerCase();
      const RESOURCE_MAP = {
        'medicine': 'MEDICINE', 'medicines': 'MEDICINE', 'medication': 'MEDICINE', 'medications': 'MEDICINE',
        'batch': 'BATCH', 'batches': 'BATCH',
        'category': 'CATEGORY', 'categories': 'CATEGORY',
        'branch': 'PHARMACY_BRANCH', 'branches': 'PHARMACY_BRANCH',
        'stock': 'STOCK', 'stock-adjustment': 'STOCK',
        'transfer': 'PHARMACY_TRANSFER', 'transfers': 'PHARMACY_TRANSFER',
        'sale': 'PHARMACY_SALE', 'sales': 'PHARMACY_SALE',
        'prescription': 'PRESCRIPTION', 'prescriptions': 'PRESCRIPTION',
        'requisition': 'REQUISITION', 'requisitions': 'REQUISITION',
        'grn': 'GRN', 'goods-receiving': 'GRN',
        'expiry': 'EXPIRY', 'expiry-management': 'EXPIRY',
        'drug': 'DRUG', 'drugs': 'DRUG',
        'worker': 'PHARMACY_WORKER', 'workers': 'PHARMACY_WORKER',
        'staff': 'PHARMACY_STAFF',
        'shipment': 'SHIPMENT', 'shipments': 'SHIPMENT',
        'warehouse': 'WAREHOUSE', 'warehouses': 'WAREHOUSE',
      };
      const VERB_MAP = { CREATE: 'CREATED', UPDATE: 'UPDATED', DELETE: 'DELETED', READ: 'VIEWED' };
      // Check if this is a bare CRUD verb that can be made more specific
      if (['CREATE', 'UPDATE', 'DELETE', 'READ'].includes(finalAction)) {
        let matched = null;
        for (const [key, val] of Object.entries(RESOURCE_MAP)) {
          if (res.includes(key)) { matched = val; break; }
        }
        if (matched) {
          finalAction = `${matched}_${VERB_MAP[finalAction] || finalAction}`;
        }
      }
    }

    await db('central_audit_logs').insert({
      user_id: userId || null,
      user_name: userName || 'System',
      role: role || 'Unknown',
      department: dept || 'General',
      module: mapModule(action, details),
      action: finalAction,
      record_identifier: resolvedIdentifier,
      previous_value: details.beforeState != null
        ? JSON.stringify(details.beforeState)
        : (details.previousValue != null ? JSON.stringify(details.previousValue) : null),
      new_value: details.afterState != null
        ? JSON.stringify(details.afterState)
        : (details.newValue != null 
             ? JSON.stringify(details.newValue) 
             : (details.details != null ? JSON.stringify(details.details) : null)),
      ip_address: details.ip || details.ipAddress || null,
    });
  } catch (error) {
    console.error('Failed to write central audit log:', error.message);
  }
};

/**
 * Retrieves audit logs strictly based on the user's role and department.
 *
 * Access matrix:
 *   Super Admin / Admin → all logs
 *   CEO / Owner        → all logs (read-only enforced at route level)
 *   Dept Manager/Head  → only their department's logs
 *   HR role            → only HR-module logs (their own department)
 *   Printing role      → only Printing-module logs (their own department)
 *   Any other employee → only their own activity
 *
 * @param {Object} user    - The authenticated user object from req.user
 * @param {Object} filters - Search/filter options
 */
const AUTO_USERS = ['System', 'System Backfill'];

const getLogs = async (user, filters = {}) => {
  let q = db('central_audit_logs').select('*').orderBy('created_at', 'desc');

  // Support both camelCase (authenticate middleware) and snake_case field names
  const rolesArray   = Array.isArray(user.roles) ? user.roles : [];
  const roleStr      = (rolesArray.join(',') || user.role_names || '').toLowerCase();
  const deptName     = (user.departmentName || user.department_name || '').toLowerCase();
  const deptFullName = user.departmentName || user.department_name || '';

  const isSuperAdmin = roleStr.includes('super admin') || roleStr.includes('admin');
  const isCEO        = roleStr.includes('ceo') || roleStr.includes('owner');
  const isManager    = roleStr.includes('manager') || roleStr.includes('head');
  const isHR         = roleStr.includes('hr') || deptName.includes('human resource') || deptName.includes('hr');
  const isPharmacy   = roleStr.includes('pharmacy') || deptName.includes('pharmacy');
  const isStore      = !isPharmacy && roleStr.includes('store');
  const isSales      = roleStr.includes('sales') || deptName.includes('sales') || deptName.includes('retail');
  const isPrinting   = roleStr.includes('printing') || deptName.includes('printing');

  if (isSuperAdmin) {
    // Super Admin — full visibility, no WHERE clause
  } else if (isCEO) {
    // CEO — scoped to ONE selected module at a time (never a mixed view).
    // The dropdown selects the module; default is CEO. Admin logins and
    // other modules are never mixed in.
    const ceoScope = filters.module || 'CEO';
    q = q.where('module', ceoScope).whereNotIn('user_name', AUTO_USERS);
  } else if (isHR) {
    // HR staff see all HR module logs, excluding automated system actions
    q = q.where('module', 'HR').whereNotIn('user_name', AUTO_USERS);
  } else if (isPrinting) {
    // Printing staff (supervisor / manager) see all Printing module logs
    // plus their own actions anywhere — mirrors the Sales pattern.
    q = q.where((builder) => {
      builder
        .where('module', 'Printing')
        .whereNotIn('user_name', AUTO_USERS)
        .orWhere('user_id', user.id);
    });
  } else if (isStore) {
    // Store Keepers see all Store module logs, excluding automated system actions
    q = q.where('module', 'Store')
          .whereNotIn('user_name', AUTO_USERS);
  } else if (isSales) {
    // Sales Manager/Head sees every Sales module activity plus their own
    // actions anywhere (covers bids/chat/etc. triggered from the sales dashboard)
    q = q.where((builder) => {
      builder
        .where('module', 'Sales')
        .whereNotIn('user_name', AUTO_USERS)
        .orWhere('user_id', user.id);
    });
  } else if (isPharmacy) {
    // Pharmacy Manager/Worker sees Pharmacy + Pharmacy Store activity
    q = q.where((builder) => {
      builder
        .whereIn('module', ['Pharmacy', 'Pharmacy Store', 'Pharmacy Sales'])
        .whereNotIn('user_name', AUTO_USERS);
    });
  } else if (isManager && deptFullName) {
    // Dept manager sees only their department's logs
    q = q.where('department', deptFullName);
  } else {
    // Regular employee — own activity only
    q = q.where('user_id', user.id);
  }

  // Auth events (login/logout/password) are only visible to Super Admin / CEO.
  // Regular employees and module staff will never see them because their
  // queries are already scoped to their own user ID or module.
  // (No global filter needed — access is already restricted above.)

  // Optional filters
  if (filters.module && !isCEO) {
    q = q.where((builder) => {
      builder.where('module', filters.module)
             .orWhere('department', filters.module);
    });
  }
  if (filters.action)  q = q.where('action', filters.action);
  if (filters.search) {
    q = q.where((builder) => {
      builder
        .where('user_name', 'like', `%${filters.search}%`)
        .orWhere('record_identifier', 'like', `%${filters.search}%`)
        .orWhere('action', 'like', `%${filters.search}%`);
    });
  }
  // Date-range filters (ISO strings e.g. "2026-08-01" or full ISO timestamps)
  if (filters.dateFrom) q = q.where('created_at', '>=', new Date(filters.dateFrom));
  if (filters.dateTo) {
    // Include the full end-day by bumping to start of next day
    const to = new Date(filters.dateTo);
    to.setDate(to.getDate() + 1);
    q = q.where('created_at', '<', to);
  }

  // Pagination — skip when fetching all rows for print
  if (!filters.noPagination) {
    const page  = parseInt(filters.page  || 1, 10);
    const limit = parseInt(filters.limit || 50, 10);
    q = q.offset((page - 1) * limit).limit(limit);
  }

  return await q;
};

module.exports = { createLog, getLogs, captureLegacy };
