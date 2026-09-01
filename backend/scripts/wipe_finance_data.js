/**
 * One-time data wipe for the finance consistency rebuild.
 * Clears transactional finance data so the smoke test starts clean.
 * KEEPS: finance_accounts (the master account list), finance_payables.
 * Run once: node scripts/wipe_finance_data.js
 */
const { db } = require('../src/config/database');

const TABLES = [
  'finance_recon_items',
  'finance_reconciliations',
  'bank_payments',
  'sales_invoice_items',
  'sales_receipts',
  'sales_invoices',
  'finance_income_submissions',
  'finance_evs',
  'finance_crvs',
  'finance_cashbook',
  'finance_receivables',
];

async function run() {
  await db.transaction(async trx => {
    for (const t of TABLES) {
      const exists = await trx.schema.hasTable(t);
      if (!exists) {
        console.log(`⚠️  ${t} does not exist — skipping.`);
        continue;
      }
      const n = await trx(t).del();
      console.log(`✅ ${t}: ${n} rows deleted.`);
    }
  });
  const kept = await db('finance_accounts').select('id', 'account_type', 'account_name');
  console.log('Kept finance_accounts:', JSON.stringify(kept));
  await db.destroy();
  console.log('Done.');
}

run().catch(err => {
  console.error('❌ Wipe failed:', err);
  process.exit(1);
});