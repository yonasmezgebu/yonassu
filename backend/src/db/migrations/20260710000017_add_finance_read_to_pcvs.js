exports.up = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.boolean('finance_read').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.dropColumn('finance_read');
  });
};
