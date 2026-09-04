exports.up = async (knex) => {
  const hasRo = await knex.schema.hasColumn('rental_orders', 'archived_at');
  if (!hasRo) {
    await knex.schema.alterTable('rental_orders', (t) => {
      t.timestamp('archived_at').nullable().defaultTo(null);
    });
  }

  const hasManual = await knex.schema.hasColumn('rental_orders', 'is_manual');
  if (!hasManual) {
    await knex.schema.alterTable('rental_orders', (t) => {
      t.boolean('is_manual').notNullable().defaultTo(false);
    });
  }

  const hasStart = await knex.schema.hasColumn('rental_orders', 'rental_start_time');
  if (!hasStart) {
    await knex.schema.alterTable('rental_orders', (t) => {
      t.timestamp('rental_start_time').nullable().defaultTo(null);
    });
  }

  const hasAo = await knex.schema.hasColumn('agrirent_orders', 'archived_at');
  if (!hasAo) {
    await knex.schema.alterTable('agrirent_orders', (t) => {
      t.timestamp('archived_at').nullable().defaultTo(null);
    });
  }
};

exports.down = async (knex) => {
  const hasRo = await knex.schema.hasColumn('rental_orders', 'archived_at');
  if (hasRo) {
    await knex.schema.alterTable('rental_orders', (t) => {
      t.dropColumn('archived_at');
    });
  }

  const hasManual = await knex.schema.hasColumn('rental_orders', 'is_manual');
  if (hasManual) {
    await knex.schema.alterTable('rental_orders', (t) => {
      t.dropColumn('is_manual');
    });
  }

  const hasStart = await knex.schema.hasColumn('rental_orders', 'rental_start_time');
  if (hasStart) {
    await knex.schema.alterTable('rental_orders', (t) => {
      t.dropColumn('rental_start_time');
    });
  }

  const hasAo = await knex.schema.hasColumn('agrirent_orders', 'archived_at');
  if (hasAo) {
    await knex.schema.alterTable('agrirent_orders', (t) => {
      t.dropColumn('archived_at');
    });
  }
};