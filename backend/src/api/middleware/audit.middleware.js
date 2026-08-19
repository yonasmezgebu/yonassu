const { audit } = require('../../config/logger');
const { db } = require('../../config/database');
const AUDIT_ACTIONS = {
  CREATE: ['POST'],
  UPDATE: ['PUT', 'PATCH'],
  DELETE: ['DELETE'],
  LOGIN: ['POST'],
  LOGOUT: ['POST'],
  APPROVE: ['POST'],
  EXPORT: ['GET']
};
const AUDIT_RESOURCES = [
  'users',
  'roles',
  'printing_orders',
  'pos_sales',
  'inventory',
  'purchase_orders',
  'expenses',
  'payments',
  'settings',
  'customers',
  'suppliers',
  'products',
  'receipts',
  'issues',
  'transfers',
  'adjustments',
  'counts',
  'requisitions',
  'branches',
  'tenders',
  'bids',
  'price-lists',
  'shifts',
  'employee-tasks',
  'employee-reports'
];
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const MODULE_MAP = [
  ['/store-sales-requests', 'Sales'],
  ['/hr-settings', 'HR'],
  ['/hr', 'HR'],
  ['/store-inventory', 'Pharmacy Store'],
  ['/store', 'Store'],
  ['/finance', 'Finance'],
  ['/pharmacy', 'Pharmacy'],
  ['/printing', 'Printing'],
  ['/procurement', 'Procurement'],
  ['/purchase', 'Procurement'],
  ['/suppliers', 'Procurement'],
  ['/tenders', 'Procurement'],
  ['/inventory', 'Inventory'],
  ['/sales', 'Sales'],
  ['/retail', 'Sales'],
  ['/pos', 'Sales'],
  ['/cars', 'Store'],
  ['/tractors', 'Store'],
  ['/rental', 'Store'],
  ['/employee-tasks', 'Employee'],
  ['/employee-reports', 'Employee'],
  ['/admin', 'Admin'],
  ['/users', 'Admin'],
  ['/auth', 'Admin'],
  ['/audit-logs', 'Admin']
];
const shouldAudit = (req) => {
  if (MUTATING_METHODS.includes(req.method)) return true;
  const url = req.originalUrl;
  for (const resource of AUDIT_RESOURCES) {
    if (url.includes(`/${resource}`)) {
      return true;
    }
  }
  if (url.includes('/auth/login') || url.includes('/auth/logout')) {
    return true;
  }
  return false;
};
const extractModule = (url) => {
  const clean = String(url || '').split('?')[0];
  for (const [prefix, module] of MODULE_MAP) {
    if (clean.startsWith('/api/v1' + prefix)) return module;
  }
  return 'General';
};
const extractResource = (url) => {
  const clean = String(url || '').split('?')[0];
  for (const resource of AUDIT_RESOURCES) {
    if (clean.includes(`/${resource}`)) {
      return resource;
    }
  }
  if (clean.includes('/auth/login')) return 'auth';
  if (clean.includes('/auth/logout')) return 'auth';
  if (clean.includes('/auth/change-password')) return 'auth';
  if (clean.includes('/auth/reset-password')) return 'auth';
  const seg = clean.replace('/api/v1', '').split('/').filter(Boolean);
  for (let i = seg.length - 1; i >= 0; i--) {
    if (!/^\d+$/.test(seg[i])) return seg[i].replace(/-/g, '_') || 'unknown';
  }
  return 'unknown';
};
const extractResourceId = (url) => {
  const matches = url.match(/\/(\d+)(?:\/|$)/);
  return matches ? matches[1] : null;
};
const getActionType = (method) => {
  const actionMap = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'READ'
  };
  if (method === 'POST' && (this?.url?.includes('/approve') || this?.url?.includes('/submit'))) {
    return 'APPROVE';
  }
  return actionMap[method] || 'UNKNOWN';
};
const captureBeforeState = async (req, resource, resourceId) => {
  if (!resourceId || !resource) return null;
  try {
    let tableName;
    switch (resource) {
      case 'users':
        tableName = 'users';
        break;
      case 'printing_orders':
        tableName = 'printing_orders';
        break;
      case 'pos_sales':
        tableName = 'pos_sales';
        break;
      case 'purchase_orders':
        tableName = 'purchase_orders';
        break;
      case 'customers':
        tableName = 'customers';
        break;
      case 'suppliers':
        tableName = 'suppliers';
        break;
      case 'products':
        tableName = 'products';
        break;
      case 'inventory':
        tableName = 'store_inventory';
        break;
      case 'receipts':
        tableName = 'stock_receipts';
        break;
      case 'issues':
        tableName = 'stock_issues';
        break;
      case 'transfers':
        tableName = 'stock_transfers';
        break;
      case 'adjustments':
        tableName = 'stock_adjustments';
        break;
      case 'counts':
        tableName = 'stock_counts';
        break;
      case 'requisitions':
        tableName = 'stock_requisitions';
        break;
      case 'branches':
        tableName = 'branches';
        break;
      case 'tenders':
        tableName = 'tenders';
        break;
      case 'bids':
        tableName = 'bids';
        break;
      case 'price-lists':
      case 'price_lists':
        tableName = 'price_lists';
        break;
      case 'shifts':
        tableName = 'pos_shifts';
        break;
      case 'employee-tasks':
        tableName = 'employee_tasks';
        break;
      case 'employee-reports':
        tableName = 'employee_reports';
        break;
      default:
        return null;
    }
    const result = await db(tableName)
      .where('id', resourceId)
      .first();
    return result;
  } catch (error) {
    console.error('Error capturing before state:', error.message);
    return null;
  }
};
const auditLog = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.json;
  let responseBody = null;
  res.json = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  const method = req.method;
  const url = req.originalUrl;
  const action = getActionType.call({ url }, method);
  const resource = extractResource(url);
  const resourceId = extractResourceId(url);

  // Capture the TRUE before-state at request start — the controller mutates
  // the row before res 'finish' fires, so finish-time reads would only ever
  // return the post-update row (identical before/after, or null for deletes).
  let beforeState = null;
  if (MUTATING_METHODS.includes(method) && (action === 'UPDATE' || action === 'DELETE') && resourceId) {
    beforeState = await captureBeforeState(req, resource, resourceId);
    if (beforeState && beforeState.password) delete beforeState.password;
    if (beforeState && beforeState.two_factor_secret) delete beforeState.two_factor_secret;
  }

  res.on('finish', async () => {
    if (!shouldAudit(req)) return;
    const userId = req.user?.id || null;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    const statusCode = res.statusCode;
    const responseTime = Date.now() - startTime;
    // Determine if action was successful
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const errorMessage = !isSuccess ? responseBody?.message || `HTTP ${statusCode}` : null;
    // After-state is read at finish time (post-mutation) — the true "after".
    let afterState = null;
    let targetId = responseBody?.data?.id;
    if (action === 'UPDATE' && !targetId && resourceId) {
      targetId = resourceId;
    }
    
    if ((action === 'CREATE' || action === 'UPDATE') && targetId) {
      afterState = await captureBeforeState(req, resource, targetId);
      if (afterState && afterState.password) {
        delete afterState.password;
      }
      if (afterState && afterState.two_factor_secret) {
        delete afterState.two_factor_secret;
      }
    }
    const auditEntry = {
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      before_state: beforeState,
      after_state: afterState,
      ip_address: ip,
      user_agent: userAgent,
      status: isSuccess ? 'success' : 'failure',
      error_message: errorMessage,
      created_at: new Date()
    };
    if (MUTATING_METHODS.includes(method)) {
      if (!req.res?.locals?.__centralAudited && !/\/auth\//.test(url)) {
        audit(action, userId, {
          ip,
          userAgent,
          resource,
          resourceId,
          beforeState,
          afterState,
          status: isSuccess ? 'success' : 'failure',
          reason: errorMessage,
          responseTime: `${responseTime}ms`,
          module: extractModule(url),
          recordIdentifier: resourceId || (responseBody?.data?.id != null ? String(responseBody.data.id) : null)
        });
      }
      return;
    }
    if ((action === 'CREATE' || action === 'UPDATE') && req.body) {
      const safeBody = { ...req.body };
      delete safeBody.password;
      delete safeBody.currentPassword;
      delete safeBody.newPassword;
      delete safeBody.two_factor_code;
      auditEntry.request_body = safeBody;
    }
    try {
      await db('audit_logs').insert(auditEntry);
    } catch (error) {
      console.error('Failed to write audit log to database:', error.message);
    }
  });
  next();
};
const auditAuthEvent = async (event, userId, req, details = {}) => {
  const auditEntry = {
    user_id: userId,
    action: event,
    resource: 'auth',
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    status: details.success !== false ? 'success' : 'failure',
    error_message: details.error,
    after_state: details,
    created_at: new Date()
  };
  audit(event, userId, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...details
  });
  try {
    await db('audit_logs').insert(auditEntry);
  } catch (error) {
    console.error('Failed to write auth audit log:', error.message);
  }
};
const auditBatch = async (userId, action, resource, items, req) => {
  const auditEntry = {
    user_id: userId,
    action: `${action}_BATCH`,
    resource,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    after_state: { count: items.length, items: items.map(i => i.id || i) },
    created_at: new Date()
  };
  audit(`${action}_BATCH`, userId, {
    ip: req.ip,
    resource,
    count: items.length
  });
  try {
    await db('audit_logs').insert(auditEntry);
  } catch (error) {
    console.error('Failed to write batch audit log:', error.message);
  }
};
module.exports = {
  auditLog,
  auditAuthEvent,
  auditBatch,
  shouldAudit,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES
};
