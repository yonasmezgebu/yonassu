// "Reserve-next / schedule later" support for AgriRent walk-in orders.
// A manager can create an order for a waitlist customer whose machine is still
// booked by the current order WITHOUT dates — start/end are filled later once
// the machine becomes available. `scheduled_later` marks that awaiting state so
// the manager and dashboards can spot orders that still need their dates set.
exports.up = async (knex) => {
  if (!(await knex.schema.hasColumn('agrirent_orders', 'scheduled_later'))) {
    await knex.schema.alterTable('agrirent_orders', (t) => {
      t.boolean('scheduled_later').nullable().defaultTo(false);
    });
  }
  if (!(await knex.schema.hasColumn('agrirent_orders', 'waitlist_id'))) {
    await knex.schema.alterTable('agrirent_orders', (t) => {
      t.integer('waitlist_id').nullable();
    });
  }
  // Schedule-later holds are created with NO hire dates, so start/end must allow NULL.
  for (const col of ['start_date', 'end_date']) {
    if (!(await knex.schema.hasColumn('agrirent_orders', col))) continue;
    const [r] = await knex.raw(
      "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'agrirent_orders' AND COLUMN_NAME = ?",
      [col]
    );
    if (r && String(r[0]?.IS_NULLABLE || 'NO').toUpperCase() !== 'YES') {
      await knex.raw(`ALTER TABLE \`agrirent_orders\` MODIFY \`${col}\` date NULL`);
    }
  }
};

exports.down = async (knex) => {
  if (await knex.schema.hasColumn('agrirent_orders', 'waitlist_id')) {
    await knex.schema.alterTable('agrirent_orders', (t) => {
      t.dropColumn('waitlist_id');
    });
  }
  if (await knex.schema.hasColumn('agrirent_orders', 'scheduled_later')) {
    await knex.schema.alterTable('agrirent_orders', (t) => {
      t.dropColumn('scheduled_later');
    });
  }
};