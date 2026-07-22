exports.up = function(knex) {
  return knex.schema.table('general_store_materials', table => {
    table.integer('reorder_level').defaultTo(10);
  });
};

exports.down = function(knex) {
  return knex.schema.table('general_store_materials', table => {
    table.dropColumn('reorder_level');
  });
};
