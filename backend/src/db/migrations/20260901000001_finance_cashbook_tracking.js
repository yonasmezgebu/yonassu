/**
 * Migration: Add reconciliation tracking to finance_cashbook and backfill history.
 *
 * Adds:
 *   finance_cashbook.payment_method  — Cash | Bank | Telebirr (normalized)
 *   finance_cashbook.is_reconciled   — whether the row has been reconciled
 *   finance_cashbook.reconciled_at   — when it was reconciled
 *
 * Backfill:
 *   1. Create missing CRV entries in the cashbook from finance_crvs so every
 *      recorded income shows up in history / accounts / reconciliation.
 *   2. Carry payment_method onto existing cashbook rows from finance_crvs /
 *      finance_evs.
 *   3. Mark rows already covered by an existing reconciliation as reconciled.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('finance_cashbook', (t) => {
    t.string('payment_method').nullable();
    t.boolean('is_reconciled').nullable().defaultTo(false);
    t.timestamp('reconciled_at').nullable();
  });

  // 1) Backfill: create any missing CRV rows in the cashbook from finance_crvs
  const crvs = await knex('finance_crvs').orderBy('id', 'asc').select('*');
  for (const c of crvs) {
    if (!c.crv_number) continue;
    const existing = await knex('finance_cashbook').where({ reference: c.crv_number }).first();
    if (!existing && c.date) {
      await knex('finance_cashbook').insert({
        date: c.date,
        type: 'CRV',
        reference: c.crv_number,
        description: c.description || `Income from ${c.received_from || 'Unknown'}`,
        receipts: c.amount,
        payments: 0,
        payment_method: c.payment_method || null,
      });
    } else if (existing && !existing.payment_method && c.payment_method) {
      await knex('finance_cashbook').where({ id: existing.id }).update({ payment_method: c.payment_method });
    }
  }

  // 2) Backfill: carry payment_method onto existing cashbook rows from finance_evs
  const evs = await knex('finance_evs').select('ev_number', 'payment_method');
  for (const e of evs) {
    if (!e.ev_number || !e.payment_method) continue;
    await knex('finance_cashbook')
      .where({ reference: e.ev_number })
      .whereNull('payment_method')
      .update({ payment_method: e.payment_method });
  }

  // 3) Backfill: mark rows already covered by an existing reconciliation
  const items = await knex('finance_recon_items').select('reference_no', 'transaction_type');
  const seen = new Set();
  for (const it of items) {
    if (!it.reference_no) continue;
    const key = `${it.reference_no}|${it.transaction_type || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const query = knex('finance_cashbook').where({ reference: it.reference_no });
    if (it.transaction_type) query.andWhere({ type: it.transaction_type });
    await query.update({ is_reconciled: true, reconciled_at: knex.fn.now() });
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('finance_cashbook', (t) => {
    t.dropColumn('reconciled_at');
    t.dropColumn('is_reconciled');
    t.dropColumn('payment_method');
  });
};