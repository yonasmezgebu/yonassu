exports.up = function (knex) {
  return knex.schema.dropTableIfExists('tenants');
};

exports.down = function (knex) {
  return knex.schema.createTable('tenants', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    t.enu('isolation', ['logical', 'schema', 'database', 'instance']);
    t.string('status', 20).defaultTo('active');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').nullable();
  });
};
