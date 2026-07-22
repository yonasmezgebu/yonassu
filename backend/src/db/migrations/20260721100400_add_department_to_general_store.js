exports.up = function(knex) {
  return knex.schema
    .table('general_store_materials', table => {
      table.string('department').defaultTo('General');
    })
    .table('general_movement_log', table => {
      table.string('department').defaultTo('General');
    })
    .table('printing_assets_machines', table => {
      table.string('department').defaultTo('Printing');
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('general_store_materials', table => {
      table.dropColumn('department');
    })
    .table('general_movement_log', table => {
      table.dropColumn('department');
    })
    .table('printing_assets_machines', table => {
      table.dropColumn('department');
    });
};
