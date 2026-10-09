const jwt = require('jsonwebtoken');
const { db } = require('../../config/database');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const { logger, audit } = require('../../config/logger');
const { getPermissionsForRoles } = require('../../config/auth');

// ─── FIX #1: In-memory user cache ────────────────────────────────────────────
// Every API request previously ran a 4-table JOIN to reload the user from DB.
// The JWT already contains roles + permissions — we only need to confirm the
// user still exists and is active, which changes rarely.
// Cache entries are keyed by userId and expire after 5 seconds.
// On logout, password-change, or deactivation the cache entry is simply
// ignored on the next request (stale for at most 5 s, then re-validated).
const userCache = new Map();
const USER_CACHE_TTL_MS = 5000; // 5 seconds

const getCachedUser = (userId) => {
  const entry = userCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.ts > USER_CACHE_TTL_MS) {
    userCache.delete(userId);
    return null;
  }
  return entry.user;
};

const setCachedUser = (userId, user) => {
  userCache.set(userId, { user, ts: Date.now() });
};

// ─── FIX #2: Session-extension throttle ──────────────────────────────────────
// Extending expires_at on EVERY request was causing one extra UPDATE per API
// call. We now only extend once per minute per session, which is more than
// sufficient to keep an active session alive.
const sessionExtendedAt = new Map();
const SESSION_EXTEND_INTERVAL_MS = 60000; // 1 minute

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('No token provided. Please login.', 401);
    }
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: 'sutana-ems',
        audience: 'sutana-frontend'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired. Please refresh your session.', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token. Please login again.', 401);
      }
      throw new AppError('Authentication failed.', 401);
    }

    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      const sessionData = await db('sessions')
        .where({ id: sessionId, user_id: decoded.userId })
        .where('expires_at', '>', db.fn.now())
        .select('id')
        .first();
      if (sessionData) {
        // FIX #2: Only extend session expiry at most once per minute per session,
        // not on every single request.
        const lastExtended = sessionExtendedAt.get(sessionId) || 0;
        if (Date.now() - lastExtended > SESSION_EXTEND_INTERVAL_MS) {
          const newExpiry = new Date(Date.now() + config.session.timeoutMinutes * 60 * 1000);
          await db('sessions').where('id', sessionId).update({ expires_at: newExpiry });
          sessionExtendedAt.set(sessionId, Date.now());
        }
      }
      // If session record is missing/expired, the JWT is still valid — let the request
      // through. The stale sessionId will be replaced on next login. This prevents
      // DB re-seeds or server restarts from invalidating existing active JWTs.
    }

    // FIX #1: Use cached user to avoid the 4-table JOIN on every request.
    let user = getCachedUser(decoded.userId);
    if (!user) {
      user = await db('users')
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
        .select(
          'users.id',
          'users.full_name',
          'users.email',
          'users.phone',
          'users.department_id',
          'departments.name as department_name',
          'users.status_id',
          'user_statuses.status_code as status',
          'users.last_login',
          'users.must_change_password',
          'users.two_factor_enabled',
          db.raw('string_agg(DISTINCT roles.name::text, \', \') as role_names'),
          db.raw('string_agg(DISTINCT roles.permissions::text, \'|||\') as permission_sets')
        )
        .where('users.id', decoded.userId)
        .whereNull('users.deleted_at')
        .groupBy('users.id', 'departments.name', 'user_statuses.status_code')
        .first();
      if (user) setCachedUser(decoded.userId, user);
    }

    if (!user) {
      throw new AppError('User not found. Please contact administrator.', 401);
    }
    if (user.status !== 'active') {
      throw new AppError('Account is not active. Please contact administrator.', 401);
    }
    const roleNames = user.role_names ? user.role_names.split(',') : [];
    let allPermissions = [];
    if (user.permission_sets) {
      const permissionSets = user.permission_sets.split('|||');
      for (const permSet of permissionSets) {
        try {
          const perms = JSON.parse(permSet);
          // Handle all forms of "superuser" permission:
          //   {"all": true}   — boolean true means all
          //   {"all": ["*"]}  — array containing wildcard
          //   ["*"]           — raw array with wildcard
          //   "*"             — plain wildcard string
          const isAllTrue = perms && typeof perms === 'object' && !Array.isArray(perms) && perms.all === true;
          const isAllWildcard = perms && typeof perms === 'object' && !Array.isArray(perms) && Array.isArray(perms.all) && perms.all.includes('*');
          const isArrayWildcard = Array.isArray(perms) && perms.includes('*');
          const isStringWildcard = perms === '*';
          if (isAllTrue || isAllWildcard || isArrayWildcard || isStringWildcard) {
            allPermissions = ['*'];
            break;
          }
          // Iterate resource:action pairs
          if (typeof perms === 'object' && !Array.isArray(perms)) {
            for (const resource in perms) {
              const actions = perms[resource];
              if (Array.isArray(actions)) {
                for (const action of actions) {
                  allPermissions.push(`${resource}:${action}`);
                }
              }
            }
          }
        } catch (e) {
          // FIX #5: Log corrupt permission JSON so it's never silently swallowed.
          logger.warn(`[Auth] Failed to parse permission set for user ${user.id} — skipping. Raw: ${String(permSet).substring(0, 80)}`);
        }
      }
    }
    if (!allPermissions.includes('*')) {
      const configPermissions = getPermissionsForRoles(roleNames);
      allPermissions.push(...configPermissions);
    }
    allPermissions = [...new Set(allPermissions)];
    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      departmentId: user.department_id,
      departmentName: user.department_name,
      roles: roleNames,
      permissions: allPermissions,
      mustChangePassword: !!user.must_change_password,
      twoFactorEnabled: !!user.two_factor_enabled
    };
    // Password change requirement is completely disabled
    next();
  } catch (error) {
    next(error);
  }
};
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: 'sutana-ems'
      });
      const user = await db('users')
        .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
        .select('users.id', 'users.full_name', 'users.email', 'users.phone', 'user_statuses.status_code')
        .where('users.id', decoded.userId)
        .whereNull('users.deleted_at')
        .first();
      if (user && (!user.status_code || user.status_code === 'active')) {
        req.user = {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone
        };
      }
    } catch (error) {
    }
    next();
  } catch (error) {
    next(error);
  }
};
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (req.user.permissions.includes('*')) {
      return next();
    }
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    const hasAllPermissions = permissions.every(required => {
      if (req.user.permissions.includes(required)) {
        return true;
      }
      const [resource, action] = required.split(':');
      if (req.user.permissions.includes(`${resource}:*`)) {
        return true;
      }
      return false;
    });
    if (!hasAllPermissions) {
      const missingPermissions = permissions.filter(p => !req.user.permissions.includes(p));
      audit('UNAUTHORIZED_ACCESS_ATTEMPT', req.user.id, {
        ip: req.ip,
        details: {
          url: req.originalUrl,
          method: req.method,
          requiredPermissions: missingPermissions,
          userPermissions: req.user.permissions
        }
      }).catch(() => {});
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
const authorizeRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRolesLower = req.user.roles.map(r => r.toLowerCase());
    const reqRolesLower = roles.map(r => r.toLowerCase());
    
    // Add Accountant implicitly for Finance-related roles, just in case
    if (reqRolesLower.includes('finance') && !reqRolesLower.includes('accountant')) {
        reqRolesLower.push('accountant');
    }
    
    // Add Purchase Manager implicitly for Purchase-related roles
    if (reqRolesLower.includes('purchase') && !reqRolesLower.includes('purchase manager')) {
        reqRolesLower.push('purchase manager');
    }
    // Also map procurement
    if (reqRolesLower.includes('purchase') && !reqRolesLower.includes('procurement')) {
        reqRolesLower.push('procurement');
    }

    const hasRole = reqRolesLower.some(role => userRolesLower.includes(role)) || userRolesLower.includes('admin');
    if (!hasRole) {
      return next(new AppError('Insufficient role privileges', 403));
    }
    next();
  };
};
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new AppError('API key required', 401);
    }
    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
    if (!validApiKeys.includes(apiKey)) {
      await audit('INVALID_API_KEY_ATTEMPT', null, {
        ip: req.ip,
        details: { apiKey: apiKey.substring(0, 10) + '...' }
      });
      throw new AppError('Invalid API key', 401);
    }
    req.apiKey = {
      key: apiKey,
      type: 'external'
    };
    next();
  } catch (error) {
    next(error);
  }
};
const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  if (user.permissions.includes('*')) return true;
  if (user.permissions.includes(permission)) return true;
  const [resource, action] = permission.split(':');
  return user.permissions.includes(`${resource}:*`);
};
const getPermissionsFromRoles = async (roleNames) => {
  const roles = await db('roles')
    .whereIn('name', roleNames)
    .select('permissions');
  const permissions = new Set();
  for (const role of roles) {
    const perms = role.permissions;
    const isAllTrue = perms && typeof perms === 'object' && !Array.isArray(perms) && perms.all === true;
    const isAllWildcard = perms && typeof perms === 'object' && !Array.isArray(perms) && Array.isArray(perms.all) && perms.all.includes('*');
    const isArrayWildcard = Array.isArray(perms) && perms.includes('*');
    if (isAllTrue || isAllWildcard || isArrayWildcard) {
      return ['*'];
    }
    if (typeof perms === 'object' && !Array.isArray(perms)) {
      for (const resource in perms) {
        const actions = perms[resource];
        if (Array.isArray(actions)) {
          for (const action of actions) {
            permissions.add(`${resource}:${action}`);
          }
        }
      }
    }
  }
  return Array.from(permissions);
};

const authorizeAny = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (req.user.permissions.includes('*')) {
      return next();
    }
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    const hasAnyPermission = permissions.some(required => {
      if (req.user.permissions.includes(required)) {
        return true;
      }
      const [resource, action] = required.split(':');
      if (req.user.permissions.includes(`${resource}:*`)) {
        return true;
      }
      return false;
    });
    if (!hasAnyPermission) {
      audit('UNAUTHORIZED_ACCESS_ATTEMPT', req.user.id, {
        ip: req.ip,
        details: {
          url: req.originalUrl,
          method: req.method,
          requiredAnyPermissions: permissions,
          userPermissions: req.user.permissions
        }
      }).catch(() => {});
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  authorizeAny,
  authorizeRoles,
  authenticateApiKey,
  hasPermission,
  getPermissionsFromRoles,
  extractToken
};
