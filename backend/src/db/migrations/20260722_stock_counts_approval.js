exports.up = async function (knex) {
  if (await knex.schema.hasTable('stock_counts')) {
    if (await knex.schema.hasColumn('stock_counts', 'status')) {
      // It's an enum, so we drop the column and re-add it with the new allowed values
      await knex.schema.alterTable('stock_counts', (t) => {
        t.dropColumn('status');
      });
      await knex.schema.alterTable('stock_counts', (t) => {
        t.enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'Draft', 'In Progress', 'Pending Verification', 'Verified', 'Closed']).defaultTo('PENDING');
        if (!knex.schema.hasColumn('stock_counts', 'rejection_reason')) {
          t.text('rejection_reason').nullable();
        }
        if (!knex.schema.hasColumn('stock_counts', 'approved_at')) {
          t.timestamp('approved_at').nullable();
        }
        if (!knex.schema.hasColumn('stock_counts', 'approved_by')) {
          t.integer('approved_by').unsigned().nullable();
        }
      });
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('stock_counts')) {
    if (await knex.schema.hasColumn('stock_counts', 'status')) {
      await knex.schema.alterTable('stock_counts', (t) => {
        t.dropColumn('status');
      });
      await knex.schema.alterTable('stock_counts', (t) => {
        t.enum('status', ['Draft', 'In Progress', 'Pending Verification', 'Verified', 'Closed']).defaultTo('Draft');
      });
    }
  }
};
