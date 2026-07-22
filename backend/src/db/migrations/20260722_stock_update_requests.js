exports.up = async function (knex) {
  await knex.schema.createTableIfNotExists('stock_update_requests', (t) => {
    t.increments('id').primary();
    t.integer('inventory_id').unsigned().notNullable().references('id').inTable('store_inventory').onDelete('CASCADE');
    t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs').onDelete('CASCADE');
    t.integer('requested_by').references('id').inTable('users').onDelete('SET NULL');
    t.json('old_data').notNullable();
    t.json('new_data').notNullable();
    t.enum('status', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
    t.string('rejection_reason', 500);
    t.integer('approved_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('approved_at');
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('stock_update_requests');
};
