exports.up = function(knex) {
  return knex.schema
    .table('printing_store_machines', table => {
      table.string('department').defaultTo('Printing');
    })
    .table('printing_store_materials', table => {
      table.string('department').defaultTo('Printing');
    })
    .table('printing_movement_log', table => {
      table.string('department').defaultTo('Printing');
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('printing_store_machines', table => {
      table.dropColumn('department');
    })
    .table('printing_store_materials', table => {
      table.dropColumn('department');
    })
    .table('printing_movement_log', table => {
      table.dropColumn('department');
    });
};
