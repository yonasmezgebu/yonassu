exports.up = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.boolean('ceo_read').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.dropColumn('ceo_read');
  });
};
