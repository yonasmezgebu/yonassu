exports.up = async (knex) => {
  const has = await knex.schema.hasTable('agrirent_orders');
  if (!has) return;

  const cols = await knex.schema.hasColumn('agrirent_orders', 'released_at');
  const colc = await knex.schema.hasColumn('agrirent_orders', 'completed_at');
  if (cols && colc) return;

  await knex.schema.alterTable('agrirent_orders', (t) => {
    if (!cols) t.timestamp('released_at').nullable();
    if (!colc) t.timestamp('completed_at').nullable();
  });
};

exports.down = async (knex) => {
  const has = await knex.schema.hasTable('agrirent_orders');
  if (!has) return;

  await knex.schema.alterTable('agrirent_orders', (t) => {
    t.dropColumn('released_at');
    t.dropColumn('completed_at');
  });
};