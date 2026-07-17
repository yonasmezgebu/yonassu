const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const { uploads, handleUploadError } = require('../../config/multer');

const authorizeUserAction = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.id == req.params.id) {
      return next(); // Users can access/update their own profile
    }
    return authorize([permission])(req, res, next);
  };
};

const createUserValidation = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('departmentId')
    .isInt().withMessage('Valid department ID is required'),
  body('roleIds')
    .isArray().withMessage('Role IDs must be an array')
    .notEmpty().withMessage('At least one role is required'),
  body('statusId')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Valid status ID is required')
];

const updateUserValidation = [
  body('fullName')
    .optional({ checkFalsy: true })
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('departmentId')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Valid department ID is required'),
  body('roleIds')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Role IDs must be an array'),
  body('statusId')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Valid status ID is required')
];

const listUsersValidation = [
  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('search')
    .optional({ checkFalsy: true })
    .isString().trim(),
  query('departmentId')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Valid department ID is required'),
  query('roleId')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Valid role ID is required'),
  query('statusId')
    .optional({ checkFalsy: true })
    .isInt().withMessage('Valid status ID is required'),
  query('includeDeleted')
    .optional({ checkFalsy: true })
    .isBoolean().toBoolean()
];

const userIdParamValidation = [
  param('id')
    .isInt().withMessage('User ID must be a valid integer')
    .toInt()
];

router.get(
  '/export',
  authenticate,
  authorize(['users:read', 'reports:export']),
  query('format').isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
  validate,
  UserController.exportUsers
);
router.get(
  '/departments',
  authenticate,
  UserController.getDepartments
);
router.get(
  '/roles',
  authenticate,
  authorize(['users:read']),
  UserController.getRoles
);

// Pharmacy Manager: employees not yet assigned as Pharmacy Worker
router.get(
  '/unassigned-employees',
  authenticate,
  async (req, res) => {
    const { db } = require('../../config/database');

    // Find the Pharmacy Worker role
    const pharmacyWorkerRole = await db('roles').where('name', 'Pharmacy Worker').first();
    if (!pharmacyWorkerRole) return res.json({ status: 'success', data: [] });

    // Find Pharmacy department id
    const pharmacyDept = await db('departments').where('name', 'Pharmacy').first();
    const pharmacyDeptId = pharmacyDept ? pharmacyDept.id : null;

    // Users already assigned as Pharmacy Worker
    const alreadyAssigned = await db('user_roles')
      .where('role_id', pharmacyWorkerRole.id)
      .pluck('user_id');

    // Protected roles — users with these should never appear in PM's assignment list
    const protectedRoles = await db('roles')
      .whereIn('name', [
        'Admin', 'CEO', 'Board', 'HR Manager', 'Finance Manager',
        'Accountant', 'Cashier', 'Pharmacy Manager', 'Sales Manager',
        'Purchase Manager', 'Store Manager', 'Car Rental Manager',
        'Printing Supervisor', 'Farming Manager', 'Market Manager'
      ])
      .pluck('id');

    // Users who already have a protected/elevated role
    const usersWithProtectedRoles = protectedRoles.length > 0
      ? await db('user_roles').whereIn('role_id', protectedRoles).pluck('user_id')
      : [];

    // Build query: is_employee=true, in Pharmacy dept, not already PW, not a protected user
    // ONLY include employees officially registered by the HR Manager (must exist in hr_employees)
    let query = db('users')
      .join('hr_employees', 'users.id', 'hr_employees.user_id')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .select(
        'users.id', 'users.full_name', 'users.email', 'users.phone',
        'departments.name as department_name', 'users.is_employee',
        'users.profile_photo'
      )
      .where('users.is_employee', true)
      .whereNull('users.deleted_at');

    // Scope to Pharmacy department if it exists in DB
    if (pharmacyDeptId) {
      query = query.where('users.department_id', pharmacyDeptId);
    }

    // Exclude already-assigned pharmacy workers
    if (alreadyAssigned.length > 0) {
      query = query.whereNotIn('users.id', alreadyAssigned);
    }

    // Exclude users with elevated/protected roles
    if (usersWithProtectedRoles.length > 0) {
      query = query.whereNotIn('users.id', usersWithProtectedRoles);
    }

    const users = await query.orderBy('users.full_name', 'asc');
    res.json({ status: 'success', data: users });
  }
);

// Pharmacy Manager: branches scoped to their assignments
router.get(
  '/my-branches',
  authenticate,
  async (req, res) => {
    const { db } = require('../../config/database');
    const managerRoles = req.user.roles || [];
    if (managerRoles.includes('Admin') || managerRoles.includes('CEO')) {
      // Admin/CEO sees all branches
      const branches = await db('branches').where('is_active', true).orderBy('name', 'asc');
      return res.json({ status: 'success', data: branches });
    }
    if (managerRoles.includes('Pharmacy Manager')) {
      const pmRole = await db('roles').where('name', 'Pharmacy Manager').first();
      if (!pmRole) return res.json({ status: 'success', data: [] });
      const branchIds = await db('user_roles')
        .where('user_id', req.user.id)
        .where('role_id', pmRole.id)
        .whereNotNull('branch_id')
        .pluck('branch_id');
      if (branchIds.length === 0) {
        // Fall back: return all branches so PM can still assign
        const allBranches = await db('branches').where('is_active', true).orderBy('name', 'asc');
        return res.json({ status: 'success', data: allBranches });
      }
      const branches = await db('branches').whereIn('id', branchIds).where('is_active', true).orderBy('name', 'asc');
      return res.json({ status: 'success', data: branches });
    }
    res.json({ status: 'success', data: [] });
  }
);

// Pharmacy Manager: list all assigned pharmacy workers (with branch & sub_role)
router.get(
  '/pharmacy-workers',
  authenticate,
  async (req, res) => {
    const { db } = require('../../config/database');
    const managerRoles = req.user.roles || [];
    const pwRole = await db('roles').where('name', 'Pharmacy Worker').first();
    if (!pwRole) return res.json({ status: 'success', data: [] });

    let query = db('user_roles as ur')
      .join('users as u', 'ur.user_id', 'u.id')
      .leftJoin('branches as b', 'ur.branch_id', 'b.id')
      .leftJoin('users as assigner', 'ur.assigned_by', 'assigner.id')
      .where('ur.role_id', pwRole.id)
      .whereNull('u.deleted_at')
      .select(
        'u.id', 'u.full_name', 'u.email', 'u.phone', 'u.profile_photo',
        'ur.sub_role', 'ur.assigned_at', 'ur.branch_id',
        'b.name as branch_name',
        'assigner.full_name as assigned_by_name'
      );

    // Scope: Pharmacy Manager only sees workers in their branches
    if (!managerRoles.includes('Admin') && !managerRoles.includes('CEO')) {
      if (managerRoles.includes('Pharmacy Manager')) {
        const pmRole = await db('roles').where('name', 'Pharmacy Manager').first();
        if (pmRole) {
          const branchIds = await db('user_roles')
            .where('user_id', req.user.id)
            .where('role_id', pmRole.id)
            .whereNotNull('branch_id')
            .pluck('branch_id');
          if (branchIds.length > 0) {
            query = query.whereIn('ur.branch_id', branchIds);
          }
        }
      }
    }

    const workers = await query.orderBy('u.full_name', 'asc');
    res.json({ status: 'success', data: workers });
  }
);

router.get(
  '/',
  authenticate,
  authorize(['users:read']),
  listUsersValidation,
  validate,
  UserController.getAllUsers
);

router.get(
  '/export',
  authenticate,
  authorize(['users:read', 'reports:export']),
  query('format').isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
  validate,
  UserController.exportUsers
);

router.get(
  '/departments',
  authenticate,
  UserController.getDepartments
);

router.get(
  '/roles',
  authenticate,
  authorize(['users:read']),
  UserController.getRoles
);

router.get(
  '/:id',
  authenticate,
  authorizeUserAction('users:read'),
  userIdParamValidation,
  validate,
  UserController.getUserById
);

router.post(
  '/',
  authenticate,
  authorize(['users:create']),
  createUserValidation,
  validate,
  UserController.createUser
);

router.put(
  '/:id',
  authenticate,
  authorizeUserAction('users:update'),
  userIdParamValidation,
  updateUserValidation,
  validate,
  UserController.updateUser
);

router.delete(
  '/:id',
  authenticate,
  authorize(['users:delete']),
  userIdParamValidation,
  validate,
  UserController.deleteUser
);

router.post(
  '/:id/restore',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  validate,
  UserController.restoreUser
);

router.post(
  '/:id/force-reset',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  validate,
  UserController.forcePasswordReset
);

router.get(
  '/:id/permissions',
  authenticate,
  authorize(['users:read']),
  userIdParamValidation,
  validate,
  UserController.getUserPermissions
);

router.post(
  '/:id/roles',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  body('roleId').isInt().withMessage('Role ID must be an integer'),
  body('branchId').optional({ nullable: true }).isInt().withMessage('Branch ID must be an integer'),
  body('subRole').optional({ nullable: true }).isString().trim(),
  validate,
  UserController.assignRoles
);

router.delete(
  '/:id/roles/:roleId',
  authenticate,
  authorize(['users:update']),
  param('id').isInt(),
  param('roleId').isInt(),
  validate,
  UserController.revokeRole
);

router.post(
  '/:id/promote-employee',
  authenticate,
  authorize(['users:update']),
  userIdParamValidation,
  validate,
  UserController.promoteToEmployee
);

router.post(
  '/custom-roles',
  authenticate,
  authorize(['users:create']),
  body('name').notEmpty().withMessage('Role name is required').isLength({ min: 2, max: 50 }),
  body('description').optional({ nullable: true }).isString(),
  body('branchScoped').optional({ nullable: true }).isBoolean(),
  body('assignToUserId').optional({ nullable: true }).isInt(),
  body('branchId').optional({ nullable: true }).isInt(),
  validate,
  UserController.createCustomRole
);

router.get(
  '/role-hierarchy',
  authenticate,
  UserController.getRoleHierarchy
);

// ── Profile Photo Upload ───────────────────────────────────────────────
// Logged-in user uploads their own photo
router.post(
  '/profile-photo',
  authenticate,
  uploads.singleProfilePicture.single('photo'),
  handleUploadError,
  UserController.uploadProfilePhoto
);

// Admin uploads a specific user's photo
router.post(
  '/:id/profile-photo',
  authenticate,
  authorize(['users:update']),
  uploads.singleProfilePicture.single('photo'),
  handleUploadError,
  UserController.uploadProfilePhoto
);

module.exports = router;
