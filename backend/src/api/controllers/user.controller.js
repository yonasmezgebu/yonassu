const { db, transaction } = require('../../config/database');
const { hashPassword, generateTemporaryPassword, validatePasswordStrength, getPermissionsForRoles } = require('../../config/auth');
const { audit } = require('../../config/logger');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const {
  ROLE_HIERARCHY,
  CUSTOM_ROLE_ASSIGNERS,
  canAssignRole,
  requiresEmployeePrecondition,
  isBranchScoped
} = require('../../config/roleHierarchy');
exports.getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    search,
    departmentId,
    roleId,
    statusId
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('users')
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
      'user_statuses.status_name as status_name',
      'users.last_login',
      'users.created_at',
      'users.must_change_password',
      'users.two_factor_enabled',
      'users.is_employee'
    )
    .whereNull('users.deleted_at');
  if (search) {
    query = query.where(function() {
      this.where('users.full_name', 'like', `%${search}%`)
        .orWhere('users.email', 'like', `%${search}%`)
        .orWhere('users.phone', 'like', `%${search}%`);
    });
  }
  if (departmentId) {
    query = query.where('users.department_id', departmentId);
  }
  if (statusId) {
    query = query.where('users.status_id', statusId);
  }
  const countQuery = query.clone().clearSelect();
  const total = await countQuery.count('users.id as total').first();
  const users = await query
    .orderBy('users.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  for (const user of users) {
    const roles = await db('user_roles')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.id', 'roles.name');
    user.roles = roles;
  }
  res.json({
    status: 'success',
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await db('users')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      'users.*',
      'departments.name as department_name',
      'user_statuses.status_name as status_name'
    )
    .where('users.id', id)
    .whereNull('users.deleted_at')
    .first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const roles = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', id)
    .select('roles.id', 'roles.name', 'roles.permissions');
  user.roles = roles;
  const roleNames = roles.map(r => r.name);
  user.permissions = getPermissionsForRoles(roleNames);
  delete user.password;
  delete user.two_factor_secret;
  res.json({
    status: 'success',
    data: { user }
  });
});
exports.createUser = catchAsync(async (req, res) => {
  const { fullName, email, phone, password, departmentId, roleIds, statusId } = req.body;
  const adminId = req.user.id;
  const ip = req.ip;
  const existingUser = await db('users')
    .where('email', email.toLowerCase())
    .first();
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }
  if (!password) {
    throw new AppError('Password is required', 400);
  }
  const hashedPassword = await hashPassword(password);
  let finalStatusId = statusId;
  if (!finalStatusId) {
    const activeStatus = await db('user_statuses').where('status_code', 'active').first();
    finalStatusId = activeStatus.id;
  }
  const result = await transaction(async (trx) => {
    const [userId] = await trx('users').insert({
      full_name: fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      department_id: departmentId,
      status_id: finalStatusId,
      must_change_password: false,
      created_by: adminId,
      created_at: db.fn.now()
    });
    for (const roleId of roleIds) {
      await trx('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: adminId,
        assigned_at: db.fn.now()
      });
    }
    return userId;
  });
  await sendEmail({
    to: email,
    subject: 'Welcome to Sutana EMS - Your Account Created',
    template: 'welcome-user',
    data: {
      name: fullName,
      email,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    }
  });
  await sendSMS({
    to: phone,
    message: `Welcome ${fullName} to Sutana EMS! You can now login using your email: ${email}.`
  }).catch(err => console.error('Failed to send SMS:', err.message));
  await audit('USER_CREATED', adminId, {
    ip,
    details: { fullName, email, phone, departmentId, roleIds }
  });
  res.status(201).json({
    status: 'success',
    message: 'User created successfully.',
    data: { userId: result }
  });
});
exports.updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, departmentId, roleIds, statusId, password, is_employee } = req.body;
  const adminId = req.user.id;
  const ip = req.ip;
  if (id == adminId) {
    const adminRoles = await db('user_roles')
      .where('user_id', id)
      .select('role_id');
    const hasAdminRole = adminRoles.some(r => r.role_id === 1); 
    if (hasAdminRole && roleIds && !roleIds.includes(1)) {
      throw new AppError('Cannot remove your own Admin role. This would lock you out.', 400);
    }
  }
  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (email) {
    const duplicate = await db('users')
      .where('id', '!=', id)
      .whereNull('deleted_at')
      .where('email', email.toLowerCase())
      .first();
    if (duplicate) {
      throw new AppError('Another user with this email already exists', 400);
    }
  }
  const updateData = {};
  if (fullName) updateData.full_name = fullName;
  if (email) updateData.email = email.toLowerCase();
  if (phone) updateData.phone = phone;
  if (departmentId) updateData.department_id = departmentId;
  if (statusId) updateData.status_id = statusId;
  if (password) updateData.password = await hashPassword(password);
  if (is_employee !== undefined) updateData.is_employee = is_employee;
  updateData.updated_at = db.fn.now();
  await transaction(async (trx) => {
    if (Object.keys(updateData).length > 0) {
      await trx('users').where('id', id).update(updateData);
    }
    if (roleIds && roleIds.length > 0) {
      const existingRoles = await trx('user_roles').where('user_id', id);
      await trx('user_roles').where('user_id', id).delete();
      for (const roleId of roleIds) {
        const existing = existingRoles.find(r => r.role_id === parseInt(roleId));
        await trx('user_roles').insert({
          user_id: id,
          role_id: roleId,
          branch_id: existing ? existing.branch_id : null,
          sub_role: existing ? existing.sub_role : null,
          assigned_by: adminId,
          assigned_at: db.fn.now()
        });
      }
    }
  });
  await audit('USER_UPDATED', adminId, {
    ip,
    details: { updates: Object.keys(updateData), roleChanged: !!roleIds }
  });
  res.json({
    status: 'success',
    message: 'User updated successfully'
  });
});
exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ip = req.ip;
  if (id == adminId) {
    throw new AppError('Cannot delete your own account', 400);
  }
  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const adminCount = await db('user_roles')
    .where('role_id', 1)
    .count('user_id as count')
    .first();
  const userRoles = await db('user_roles').where('user_id', id).select('role_id');
  const isAdmin = userRoles.some(r => r.role_id === 1);
  if (isAdmin && adminCount.count <= 1) {
    throw new AppError('Cannot delete the last Admin user', 400);
  }
  const inactiveStatus = await db('user_statuses').where('status_code', 'inactive').first();
  await db('users')
    .where('id', id)
    .update({
      status_id: inactiveStatus ? inactiveStatus.id : null,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  await audit('USER_DELETED', adminId, { ip, details: { deletedBy: adminId } });
  res.json({
    status: 'success',
    message: 'User deleted successfully'
  });
});
exports.restoreUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ip = req.ip;
  const user = await db('users').where('id', id).whereNotNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found or not deleted', 404);
  }
  const deletedAt = new Date(user.deleted_at);
  const daysSinceDelete = (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelete > 30) {
    throw new AppError('Cannot restore user after 30 days of deletion', 400);
  }
  const activeStatus = await db('user_statuses').where('status_code', 'active').first();
  await db('users')
    .where('id', id)
    .update({
      status_id: activeStatus ? activeStatus.id : null,
      deleted_at: null,
      updated_at: db.fn.now()
    });
  await audit('USER_RESTORED', adminId, { ip, details: { restoredBy: adminId } });
  res.json({
    status: 'success',
    message: 'User restored successfully'
  });
});
exports.forcePasswordReset = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const adminId = req.user.id;
  const ip = req.ip;
  if (!password) {
    throw new AppError('Password is required', 400);
  }
  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const hashedPassword = await hashPassword(password);
  await transaction(async (trx) => {
    await trx('password_history').insert({
      user_id: id,
      password_hash: user.password
    });
    await trx('users')
      .where('id', id)
      .update({
        password: hashedPassword,
        must_change_password: false,
        updated_at: db.fn.now()
      });
  });
  await audit('FORCE_PASSWORD_RESET', adminId, { ip, details: { resetBy: adminId } });
  res.json({
    status: 'success',
    message: 'Password reset successfully.'
  });
});
exports.getUserPermissions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const roles = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', id)
    .select('roles.name', 'roles.permissions');
  const roleNames = roles.map(r => r.name);
  const permissions = getPermissionsForRoles(roleNames);
  res.json({
    status: 'success',
    data: {
      userId: parseInt(id),
      roles: roleNames,
      permissions
    }
  });
});
exports.assignRoles = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { roleId, branchId, subRole } = req.body;
  const adminId = req.user.id;
  const assignerRoles = req.user.roles;
  const ip = req.ip;

  // 1. Find target user
  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) throw new AppError('User not found', 404);

  // 2. Find the target role record
  const roleRecord = await db('roles').where('id', roleId).first();
  if (!roleRecord) throw new AppError('Role not found', 404);

  // 3. Authority check — does the logged-in user have permission to assign this role?
  const authorityCheck = canAssignRole(assignerRoles, roleRecord.name);
  if (!authorityCheck.allowed) {
    throw new AppError(authorityCheck.reason || 'You do not have authority to assign this role.', 403);
  }

  // 4. Employee precondition gate
  if (requiresEmployeePrecondition(roleRecord.name) && !user.is_employee) {
    throw new AppError(
      `Cannot assign "${roleRecord.name}" — this user must first be onboarded as an Employee by HR Manager.`,
      422
    );
  }

  // 5. Branch requirement gate
  if (isBranchScoped(roleRecord.name) && !branchId) {
    throw new AppError(
      `The "${roleRecord.name}" role requires a branch to be selected.`,
      422
    );
  }

  // 6. Pharmacy Manager branch-scope enforcement (REMOVED as per user request to allow managers to assign to any branch)
  // The restriction was previously blocking assignments if the manager wasn't strictly scoped to the same branch.

  // 7. Prevent self-assignment of elevating roles (cannot grant yourself a higher role)
  if (parseInt(id) === adminId && !assignerRoles.includes('Admin')) {
    throw new AppError('You cannot assign roles to yourself.', 403);
  }

  // 8. Prevent duplicate role assignment - NO, we want to allow UPDATING the branch/sub-role
  const existingAssignment = await db('user_roles')
    .where({ user_id: id, role_id: roleId })
    .first();
  if (existingAssignment) {
    // Update existing assignment
    await db('user_roles')
      .where({ user_id: id, role_id: roleId })
      .update({
        branch_id: branchId || null,
        sub_role: subRole || null,
        assigned_by: adminId,
        assigned_at: db.fn.now()
      });
  } else {
    // Insert the new role assignment
    await db('user_roles').insert({
      user_id: id,
      role_id: roleId,
      branch_id: branchId || null,
      sub_role: subRole || null,
      assigned_by: adminId,
      assigned_at: db.fn.now()
    });
  }

  // 10. Audit trail
  await audit('ROLE_ASSIGNED', adminId, {
    ip,
    details: {
      roleName: roleRecord.name,
      roleId,
      branchId: branchId || null,
      subRole: subRole || null,
      assignedBy: adminId,
      assignerRoles
    }
  });

  res.json({
    status: 'success',
    message: `Role "${roleRecord.name}" assigned successfully.`
  });
});
exports.removeRole = catchAsync(async (req, res) => {
  const { id, roleId } = req.params;
  const adminId = req.user.id;
  const ip = req.ip;
  if (roleId == 1) {
    const adminCount = await db('user_roles')
      .where('role_id', 1)
      .count('user_id as count')
      .first();
    if (adminCount.count <= 1) {
      throw new AppError('Cannot remove the last Admin role', 400);
    }
  }
  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  await db('user_roles')
    .where('user_id', id)
    .where('role_id', roleId)
    .delete();
  await audit('ROLE_REMOVED', adminId, { ip, details: { roleId, removedBy: adminId } });
  res.json({
    status: 'success',
    message: 'Role removed successfully'
  });
});
exports.exportUsers = catchAsync(async (req, res) => {
  const { format } = req.query;
  const users = await db('users')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      'users.id',
      'users.full_name',
      'users.email',
      'users.phone',
      'departments.name as department',
      'user_statuses.status_name as status',
      'users.last_login',
      'users.created_at'
    )
    .whereNull('users.deleted_at');
  for (const user of users) {
    const roles = await db('user_roles')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.name');
    user.roles = roles.map(r => r.name).join(', ');
  }
  await audit('USERS_EXPORTED', req.user.id, { ip: req.ip, details: { format } });
  if (format === 'csv') {
    const json2csv = require('json2csv').parse;
    const csv = json2csv(users);
    res.header('Content-Type', 'text/csv');
    res.attachment(`users_export_${Date.now()}.csv`);
    return res.send(csv);
  }
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Full Name', key: 'full_name', width: 30 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Roles', key: 'roles', width: 30 },
    { header: 'Last Login', key: 'last_login', width: 20 },
    { header: 'Created At', key: 'created_at', width: 20 }
  ];
  worksheet.addRows(users);
  res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.attachment(`users_export_${Date.now()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});
exports.getDepartments = catchAsync(async (req, res) => {
  const departments = await db('departments')
    .select('id', 'name', 'description')
    .orderBy('name');
  res.json({
    status: 'success',
    data: { departments }
  });
});
exports.getRoles = catchAsync(async (req, res) => {
  const roles = await db('roles')
    .select('id', 'name', 'description', 'is_custom', 'branch_scoped')
    .orderBy('name');
  // Attach hierarchy metadata from the config
  const enriched = roles.map(r => {
    const config = ROLE_HIERARCHY.find(h => h.name === r.name);
    return {
      ...r,
      requiresEmployee: config ? config.requiresEmployee : true,
      branchScoped: config ? config.branchScoped : false,
      isPreExisting: config ? config.isPreExisting : false,
      subRoles: config ? config.subRoles : []
    };
  });
  res.json({
    status: 'success',
    data: { roles: enriched }
  });
});

/**
 * POST /users/:id/promote-employee
 * Promote a user to Employee status. Only HR Manager or CEO (or Admin).
 */
exports.promoteToEmployee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const assignerRoles = req.user.roles;
  const ip = req.ip;

  // Only HR Manager, CEO, Admin can promote to Employee
  const canPromote = assignerRoles.some(r => ['HR Manager', 'CEO', 'Admin'].includes(r));
  if (!canPromote) {
    throw new AppError('Only HR Manager or CEO can onboard users as Employees.', 403);
  }

  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) throw new AppError('User not found', 404);

  if (user.is_employee) {
    return res.json({ status: 'success', message: 'User is already an Employee.' });
  }

  // Find the Employee role in DB
  const employeeRole = await db('roles').where('name', 'Employee').first();
  if (!employeeRole) throw new AppError('Employee role not found in database. Please run migrations.', 500);

  await transaction(async (trx) => {
    // Mark the user as employee
    await trx('users').where('id', id).update({ is_employee: true, updated_at: db.fn.now() });
    // Ensure Employee role is assigned
    const already = await trx('user_roles').where({ user_id: id, role_id: employeeRole.id }).first();
    if (!already) {
      await trx('user_roles').insert({
        user_id: id,
        role_id: employeeRole.id,
        assigned_by: adminId,
        assigned_at: db.fn.now()
      });
    }
  });

  await audit('USER_PROMOTED_TO_EMPLOYEE', adminId, {
    ip,
    details: { promotedBy: adminId, promoterRoles: assignerRoles }
  });

  res.json({
    status: 'success',
    message: 'User successfully onboarded as Employee.'
  });
});

/**
 * DELETE /users/:id/roles/:roleId
 * Remove a specific role from a user.
 */
exports.revokeRole = catchAsync(async (req, res) => {
  const { id, roleId } = req.params;
  const adminId = req.user.id;
  const assignerRoles = req.user.roles;
  const ip = req.ip;

  const roleRecord = await db('roles').where('id', roleId).first();
  if (!roleRecord) throw new AppError('Role not found', 404);

  // Cannot remove Admin role if it is the last one
  if (roleRecord.name === 'Admin') {
    const adminCount = await db('user_roles').where('role_id', roleId).count('user_id as count').first();
    if (parseInt(adminCount.count) <= 1) {
      throw new AppError('Cannot remove the last Admin role from the system.', 400);
    }
  }

  const user = await db('users').where('id', id).whereNull('deleted_at').first();
  if (!user) throw new AppError('User not found', 404);

  await db('user_roles').where({ user_id: id, role_id: roleId }).delete();

  await audit('ROLE_REVOKED', adminId, {
    ip,
    details: { roleName: roleRecord.name, roleId, revokedBy: adminId }
  });

  res.json({ status: 'success', message: `Role "${roleRecord.name}" removed.` });
});

/**
 * POST /users/custom-roles
 * CEO (or Admin) can create a brand-new custom role and immediately assign it.
 */
exports.createCustomRole = catchAsync(async (req, res) => {
  const { name, description, branchScoped, assignToUserId, branchId } = req.body;
  const adminId = req.user.id;
  const assignerRoles = req.user.roles;
  const ip = req.ip;

  // Only CEO or Admin can create custom roles
  if (!assignerRoles.some(r => CUSTOM_ROLE_ASSIGNERS.includes(r))) {
    throw new AppError('Only CEO or Admin can create custom roles.', 403);
  }
  if (!name || name.trim().length < 2) {
    throw new AppError('Role name must be at least 2 characters.', 400);
  }

  // Check for duplicate role name
  const existing = await db('roles').where('name', name.trim()).first();
  if (existing) throw new AppError(`A role named "${name.trim()}" already exists.`, 409);

  // Create the custom role
  const [newRoleId] = await db('roles').insert({
    name: name.trim(),
    description: description || '',
    permissions: JSON.stringify({}),
    is_custom: true,
    branch_scoped: !!branchScoped,
    created_by: adminId,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  await audit('CUSTOM_ROLE_CREATED', null, {
    ip,
    details: { roleName: name, newRoleId, branchScoped, createdBy: adminId }
  });

  // Optionally assign to a user immediately
  if (assignToUserId) {
    const targetUser = await db('users').where('id', assignToUserId).whereNull('deleted_at').first();
    if (!targetUser) throw new AppError('Target user for assignment not found', 404);
    if (!targetUser.is_employee) {
      throw new AppError('Cannot assign custom role — target user must first be onboarded as an Employee.', 422);
    }
    await db('user_roles').insert({
      user_id: assignToUserId,
      role_id: newRoleId,
      branch_id: branchId || null,
      assigned_by: adminId,
      assigned_at: db.fn.now()
    });
    await audit('CUSTOM_ROLE_ASSIGNED', adminId, {
      ip,
      details: { roleName: name, newRoleId, branchId: branchId || null, assignedBy: adminId }
    });
  }

  res.status(201).json({
    status: 'success',
    message: `Custom role "${name.trim()}" created successfully.`,
    data: { roleId: newRoleId }
  });
});

/**
 * GET /users/role-hierarchy
 * Returns the full role hierarchy config (for the UI to use).
 */
exports.getRoleHierarchy = catchAsync(async (req, res) => {
  res.json({
    status: 'success',
    data: { hierarchy: ROLE_HIERARCHY }
  });
});

/**
 * POST /users/profile-photo         (logged-in user updates own photo)
 * POST /users/:id/profile-photo     (admin updates any user's photo)
 */
exports.uploadProfilePhoto = catchAsync(async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  // Determine target user id
  const targetId = req.params.id ? parseInt(req.params.id) : req.user.id;
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  // Build public URL (relative to /uploads/)
  let filePath = req.file.path.replace(/\\/g, '/');
  if (!filePath.startsWith('/')) filePath = '/' + filePath;
  const publicUrl = filePath.replace(/^.*\/uploads\//, '/uploads/');
  // Delete old photo if it exists
  const existing = await db('users').where('id', targetId).select('profile_photo').first();
  if (existing && existing.profile_photo) {
    const oldPath = path.join(process.cwd(), existing.profile_photo);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch (_) {}
    }
  }
  await db('users').where('id', targetId).update({
    profile_photo: publicUrl,
    updated_at: db.fn.now()
  });
  res.json({
    status: 'success',
    data: { profilePhoto: publicUrl }
  });
});

