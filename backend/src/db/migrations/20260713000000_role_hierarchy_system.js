/**
 * Migration: Add is_employee flag to users and branch_id to user_roles
 * Also seeds the 14 standard roles if not present.
 * Backfills is_employee = true for all users who already have a non-Customer role.
 */
exports.up = async function (knex) {
  // 1. Add is_employee column to users table (if not already there)
  const hasIsEmployee = await knex.schema.hasColumn('users', 'is_employee');
  if (!hasIsEmployee) {
    await knex.schema.table('users', (t) => {
      t.boolean('is_employee').defaultTo(false).notNullable().after('two_factor_enabled');
    });
  }

  // 2. Add branch_id and sub_role to user_roles (for branch-scoped assignments)
  const hasBranchId = await knex.schema.hasColumn('user_roles', 'branch_id');
  if (!hasBranchId) {
    await knex.schema.table('user_roles', (t) => {
      t.integer('branch_id').unsigned().nullable().after('role_id');
      t.string('sub_role', 100).nullable().after('branch_id');
    });
  }

  // 3. Seed the 14 standard roles (skip if already exist by name)
  const standardRoles = [
    { name: 'Finance Manager',      description: 'Manages financial operations and reporting.' },
    { name: 'Accountant',           description: 'Handles accounting tasks under Finance.' },
    { name: 'Cashier',              description: 'POS cashier under Finance.' },
    { name: 'Admin',                description: 'System administrator with full access.' },
    { name: 'Pharmacy Manager',     description: 'Manages pharmacy operations.' },
    { name: 'Pharmacy Worker',      description: 'Pharmacy worker tied to a specific branch.' },
    { name: 'Car Rental Manager',   description: 'Manages car rental operations.' },
    { name: 'CEO',                  description: 'Chief Executive Officer — top-level.' },
    { name: 'Board',                description: 'Board member.' },
    { name: 'HR Manager',           description: 'Manages human resources and employee onboarding.' },
    { name: 'Printing Supervisor',  description: 'Supervises printing department operations.' },
    { name: 'Customer',             description: 'Self-registered customer.' },
    { name: 'Employee',             description: 'Base employee onboarding role.' },
    { name: 'Sales Manager',        description: 'Manages sales operations.' },
    { name: 'Purchase Manager',     description: 'Manages procurement and supplier relationships.' },
    { name: 'Store Manager',        description: 'Manages store operations.' },
  ];

  for (const role of standardRoles) {
    const existing = await knex('roles').where('name', role.name).first();
    if (!existing) {
      await knex('roles').insert({
        name: role.name,
        description: role.description,
        permissions: JSON.stringify({}),
        created_at: knex.fn.now()
      });
    }
  }

  // 4. Backfill: mark as employee everyone who already has a non-Customer/non-Employee role
  const employeeRole = await knex('roles').where('name', 'Employee').first();
  const customerRole = await knex('roles').where('name', 'Customer').first();

  if (employeeRole && customerRole) {
    // Get users who have any role other than Customer (they were already doing job work)
    const nonCustomerUserRoles = await knex('user_roles')
      .whereNotIn('role_id', [customerRole.id])
      .select('user_id');
    const nonCustomerUserIds = [...new Set(nonCustomerUserRoles.map(r => r.user_id))];

    if (nonCustomerUserIds.length > 0) {
      // Mark them as employees
      await knex('users')
        .whereIn('id', nonCustomerUserIds)
        .update({ is_employee: true });

      // Also make sure they have the Employee role entry
      for (const userId of nonCustomerUserIds) {
        const hasEmployeeRole = await knex('user_roles')
          .where({ user_id: userId, role_id: employeeRole.id })
          .first();
        if (!hasEmployeeRole) {
          await knex('user_roles').insert({
            user_id: userId,
            role_id: employeeRole.id,
            assigned_at: knex.fn.now()
          });
        }
      }
    }
  }
};

exports.down = async function (knex) {
  // Remove the added columns (best effort — don't remove seeded roles)
  const hasIsEmployee = await knex.schema.hasColumn('users', 'is_employee');
  if (hasIsEmployee) {
    await knex.schema.table('users', (t) => {
      t.dropColumn('is_employee');
    });
  }

  const hasBranchId = await knex.schema.hasColumn('user_roles', 'branch_id');
  if (hasBranchId) {
    await knex.schema.table('user_roles', (t) => {
      t.dropColumn('branch_id');
      t.dropColumn('sub_role');
    });
  }
};
