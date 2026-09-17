/**
 * Migration: Add cpo_amount to tenders table
 */
exports.up = async (knex) => {
  const exists = await knex.schema.hasColumn('tenders', 'cpo_amount');
  if (!exists) {
    await knex.schema.table('tenders', (t) => {
      t.decimal('cpo_amount', 15, 2).nullable().defaultTo(0.00);
    });
  }
};

exports.down = async (knex) => {
  const exists = await knex.schema.hasColumn('tenders', 'cpo_amount');
  if (exists) {
    await knex.schema.table('tenders', (t) => {
      t.dropColumn('cpo_amount');
    });
  }
};
