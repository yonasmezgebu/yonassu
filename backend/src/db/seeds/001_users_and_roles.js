/**
 * 001_users_and_roles_seed.js
 * Seeds all system roles and one demo user per role (except Customer).
 * Safe to re-run — uses ON CONFLICT DO NOTHING.
 */
const bcrypt = require('bcryptjs');

// Plain-text password each demo account will use
const DEFAULT_PASSWORD = 'Sutana@2026!';

const ROLES = [
  { name: 'Admin',                description: 'Full system access',               permissions: { all: true } },
  { name: 'CEO',                  description: 'Executive dashboard & reports',     permissions: { all: true } },
  { name: 'Board Member',         description: 'Board meetings & resolutions',      permissions: {} },
  { name: 'HR Manager',           description: 'HR management',                    permissions: {} },
  { name: 'Finance Manager',      description: 'Finance oversight',                permissions: {} },
  { name: 'Sales Manager',        description: 'Sales oversight',                  permissions: {} },
  { name: 'Purchase',             description: 'Procurement & purchasing',         permissions: {} },
  { name: 'Store Manager',        description: 'Inventory & store management',     permissions: {} },
  { name: 'Pharmacy Manager',     description: 'Pharmacy management',             permissions: {} },
  { name: 'Pharmacy Worker',      description: 'Pharmacy dispensing',             permissions: {} },
  { name: 'Printing Manager',     description: 'Printing department head',         permissions: {} },
  { name: 'Employee',             description: 'General employee access',          permissions: {} },
];

// One demo user per role: email, full_name, phone, role_name
const USERS = [
  { email: 'admin@sutana.com',            full_name: 'Admin User',             phone: '0911000001', role: 'Admin' },
  { email: 'ceo@sutana.com',              full_name: 'Bekele Tadesse',         phone: '0911000002', role: 'CEO' },
  { email: 'board@sutana.com',            full_name: 'Almaz Getachew',         phone: '0911000003', role: 'Board Member' },
  { email: 'hrmanager@sutana.com',        full_name: 'Tigist Haile',           phone: '0911000004', role: 'HR Manager' },
  { email: 'financemanager@sutana.com',   full_name: 'Mekdes Worku',           phone: '0911000006', role: 'Finance Manager' },
  { email: 'salesmanager@sutana.com',     full_name: 'Solomon Tesfaye',        phone: '0911000009', role: 'Sales Manager' },
  { email: 'purchase@sutana.com',         full_name: 'Getaneh Mihtere',        phone: '0911000011', role: 'Purchase' },
  { email: 'storemanager@sutana.com',     full_name: 'Abebe Kebede',           phone: '0911000012', role: 'Store Manager' },
  { email: 'pharmacymanager@sutana.com',  full_name: 'Selamawit Girma',        phone: '0911000013', role: 'Pharmacy Manager' },
  { email: 'pharmacist@sutana.com',       full_name: 'Rahel Tesfae',           phone: '0911000014', role: 'Pharmacy Worker' },
  { email: 'printingmanager@sutana.com',  full_name: 'Eyob Alemu',             phone: '0911000016', role: 'Printing Manager' },
  { email: 'employ@sutana.com',           full_name: 'Misrak Tsehayneh',       phone: '0911000019', role: 'Employee' },
];

exports.seed = async function (knex) {
  console.log('\n🌱 Seeding roles and demo users...');

  // ── 1. Ensure department 1 exists (users FK requires it) ──────────────────
  const deptExists = await knex('departments').where('id', 1).first().catch(() => null);
  if (!deptExists) {
    const hasDepts = await knex.schema.hasTable('departments');
    if (hasDepts) {
      // Try to get any dept
      const anyDept = await knex('departments').first();
      if (!anyDept) {
        await knex.raw(`INSERT INTO departments (id, name) VALUES (1, 'General') ON CONFLICT DO NOTHING`);
      }
    }
  }

  // ── 2. Ensure user_statuses row 1 exists ──────────────────────────────────
  const hasStatusTable = await knex.schema.hasTable('user_statuses');
  if (hasStatusTable) {
    const statusExists = await knex('user_statuses').where('id', 1).first().catch(() => null);
    if (!statusExists) {
      await knex.raw(`INSERT INTO user_statuses (id, status_code, status_name, color_hex) VALUES (1, 'active', 'Active', '#22c55e') ON CONFLICT DO NOTHING`);
    }
  }

  // ── 3. Seed roles ─────────────────────────────────────────────────────────
  for (const role of ROLES) {
    await knex.raw(
      `INSERT INTO roles (name, description, permissions, is_custom, branch_scoped)
       VALUES (?, ?, ?::jsonb, false, false)
       ON CONFLICT (name) DO NOTHING`,
      [role.name, role.description, JSON.stringify(role.permissions)]
    );
  }
  console.log(`✅ Seeded ${ROLES.length} roles`);

  // ── 4. Hash password once ─────────────────────────────────────────────────
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // ── 5. Get department_id to use ───────────────────────────────────────────
  let deptId = 1;
  const anyDept = await knex('departments').first().catch(() => null);
  if (anyDept) deptId = anyDept.id;

  // ── 6. Get status_id to use ───────────────────────────────────────────────
  let statusId = 1;
  if (hasStatusTable) {
    const anyStatus = await knex('user_statuses').first().catch(() => null);
    if (anyStatus) statusId = anyStatus.id;
  }

  // ── 7. Seed users ─────────────────────────────────────────────────────────
  let created = 0;
  for (const u of USERS) {
    const existing = await knex('users').where('email', u.email).first().catch(() => null);
    if (!existing) {
      const [userId] = await knex('users').insert({
        full_name:      u.full_name,
        email:          u.email,
        phone:          u.phone,
        password:       hashed,
        department_id:  deptId,
        status_id:      statusId,
        is_employee:    true,
        chat_enabled:   true,
        created_at:     new Date(),
        updated_at:     new Date(),
      }).returning('id');

      const roleRow = await knex('roles').where('name', u.role).first();
      if (roleRow && userId) {
        const uid = typeof userId === 'object' ? userId.id : userId;
        await knex.raw(
          `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
          [uid, roleRow.id]
        );
      }
      created++;
    } else {
      console.log(`  ⏭  Skipped (already exists): ${u.email}`);
    }
  }
  console.log(`✅ Created ${created} demo users`);
  console.log(`\n🔑 Default password for ALL accounts: ${DEFAULT_PASSWORD}\n`);
};
