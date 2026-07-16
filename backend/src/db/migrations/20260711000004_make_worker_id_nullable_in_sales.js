exports.up = async (knex) => {
  // Make worker_id nullable in sales table (for online orders submitted before worker processes them)
  const hasSales = await knex.schema.hasTable('sales');
  if (hasSales) {
    await knex.schema.alterTable('sales', (t) => {
      t.integer('worker_id').nullable().alter();
    });
    // Also add status values support — add PENDING_VERIFICATION if needed (column already exists)
  }
  // If table doesn't exist yet, the main migration will handle it correctly
};

exports.down = async (knex) => {
  await knex.schema.alterTable('sales', (t) => {
    t.integer('worker_id').notNullable().alter();
  });
};
