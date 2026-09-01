/**
 * One-time migration: adds per-account ledger tracking to `finance_cashbook`
 * (account_id, account_name, source, received_from) so the cashbook becomes the
 * single source of truth that Accounts & Reconciliation read from.
 * Run once: node scripts/apply_cashbook_account_ledger.js
 */
const { db } = require('../src/config/database');

const MIGRATION_NAME = '20260901000002_finance_cashbook_account_ledger.js';
const BATCH = 1045;

async function run() {
  const hasAccountId = await db.schema.hasColumn('finance_cashbook', 'account_id');
  if (hasAccountId) {
    console.log('✅ finance_cashbook.account_id already exists — checking remaining columns.');
  } else {
    await db.schema.table('finance_cashbook', table => {
      table.integer('account_id').unsigned().nullable();
      table.string('account_name', 255).nullable();
      table.string('source', 255).nullable();
      table.string('received_from', 255).nullable();
      table.index('account_id', 'idx_cashbook_account');
    });
    console.log('✅ Added account_id / account_name / source / received_from to finance_cashbook.');
  }

  const existing = await db('knex_migrations').where({ name: MIGRATION_NAME }).first();
  if (!existing) {
    await db('knex_migrations').insert({ name: MIGRATION_NAME, batch: BATCH, migration_time: new Date() });
    console.log('✅ Recorded migration in knex_migrations.');
  } else {
    console.log('✅ Migration already recorded in knex_migrations.');
  }

  await db.destroy();
  console.log('Done.');
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});