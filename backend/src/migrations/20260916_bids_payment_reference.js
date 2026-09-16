/**
 * Migration: Add payment_reference column to bids table
 * This column stores the bank/telebirr transaction reference
 * submitted by the Sales Manager when forwarding a bid to Finance.
 */
exports.up = async (knex) => {
  const exists = await knex.schema.hasColumn('bids', 'payment_reference');
  if (!exists) {
    await knex.schema.table('bids', (t) => {
      t.string('payment_reference', 500).nullable();
    });
  }
};

exports.down = async (knex) => {
  const exists = await knex.schema.hasColumn('bids', 'payment_reference');
  if (exists) {
    await knex.schema.table('bids', (t) => {
      t.dropColumn('payment_reference');
    });
  }
};
