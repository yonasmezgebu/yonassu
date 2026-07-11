exports.up = async function (knex) {
  if (await knex.schema.hasTable('stock_adjustments')) {
    if (!(await knex.schema.hasColumn('stock_adjustments', 'status'))) {
      await knex.schema.alterTable('stock_adjustments', (t) => {
        t.enu('status', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
        t.text('rejection_reason').nullable();
        t.timestamp('approved_at').nullable();
      });
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('stock_adjustments')) {
    if (await knex.schema.hasColumn('stock_adjustments', 'approved_at')) {
      await knex.schema.alterTable('stock_adjustments', (t) => t.dropColumn('approved_at'));
    }
    if (await knex.schema.hasColumn('stock_adjustments', 'rejection_reason')) {
      await knex.schema.alterTable('stock_adjustments', (t) => t.dropColumn('rejection_reason'));
    }
    if (await knex.schema.hasColumn('stock_adjustments', 'status')) {
      await knex.schema.alterTable('stock_adjustments', (t) => t.dropColumn('status'));
    }
  }
};
