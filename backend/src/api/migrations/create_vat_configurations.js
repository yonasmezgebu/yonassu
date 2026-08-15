/**
 * Migration: Create vat_configurations and vat_change_history tables
 * Central VAT/Tax configuration — single source of truth for all ERP modules.
 */

exports.up = async function (knex) {
  // ── 1. vat_configurations ─────────────────────────────────────────────────
  await knex.schema.createTable('vat_configurations', (t) => {
    t.increments('id').unsigned().primary();
    t.string('name', 100).notNullable();                         // e.g. 'VAT'
    t.enum('treatment', ['standard', 'exempt', 'zero_rated']).notNullable();
    t.decimal('rate', 5, 4).notNullable().defaultTo(0);          // 0.1500 = 15%
    t.text('description').nullable();
    t.boolean('is_active').defaultTo(true);
    t.date('effective_from').nullable();
    t.boolean('requires_approval').defaultTo(true);
    t.integer('approved_by').unsigned().nullable();   // references users.id
    t.timestamp('approved_at').nullable();
    t.integer('created_by').unsigned().nullable();    // references users.id
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── 2. vat_change_history (immutable audit trail) ─────────────────────────
  await knex.schema.createTable('vat_change_history', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('vat_config_id').unsigned().notNullable()
      .references('id').inTable('vat_configurations').onDelete('CASCADE');
    t.enum('change_type', ['created', 'updated', 'approved', 'rejected', 'deactivated']).notNullable();
    t.decimal('old_rate', 5, 4).nullable();
    t.decimal('new_rate', 5, 4).nullable();
    t.string('old_treatment', 50).nullable();
    t.string('new_treatment', 50).nullable();
    t.date('old_effective_from').nullable();
    t.date('new_effective_from').nullable();
    t.integer('changed_by_id').unsigned().nullable();   // references users.id
    t.string('changed_by_name', 150).nullable();
    t.string('changed_by_role', 100).nullable();
    t.enum('approval_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    t.integer('approved_by_id').unsigned().nullable(); // references users.id
    t.string('approved_by_name', 150).nullable();
    t.text('notes').nullable();
    t.string('ip_address', 45).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ── 3. Seed the 3 standard VAT treatments ─────────────────────────────────
  const now = knex.fn.now();
  await knex('vat_configurations').insert([
    {
      name: 'VAT',
      treatment: 'standard',
      rate: 0.1500,
      description: 'Standard VAT — 15%. Applied on most taxable goods and services.',
      is_active: true,
      effective_from: '2024-01-01',
      requires_approval: true,
      created_at: now,
      updated_at: now,
    },
    {
      name: 'VAT',
      treatment: 'exempt',
      rate: 0.0000,
      description: 'VAT Exempt — 0%. Exempt classification. Not interchangeable with Zero-Rated.',
      is_active: true,
      effective_from: '2024-01-01',
      requires_approval: true,
      created_at: now,
      updated_at: now,
    },
    {
      name: 'VAT',
      treatment: 'zero_rated',
      rate: 0.0000,
      description: 'VAT Zero-Rated — 0%. Zero-rated classification. Not interchangeable with Exempt.',
      is_active: true,
      effective_from: '2024-01-01',
      requires_approval: true,
      created_at: now,
      updated_at: now,
    },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('vat_change_history');
  await knex.schema.dropTableIfExists('vat_configurations');
};
