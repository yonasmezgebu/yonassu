exports.up = function(knex) {
  return knex.schema
    .renameTable('printing_store_materials', 'general_store_materials')
    .renameTable('printing_movement_log', 'general_movement_log')
    .renameTable('printing_store_machines', 'printing_assets_machines');
};

exports.down = function(knex) {
  return knex.schema
    .renameTable('general_store_materials', 'printing_store_materials')
    .renameTable('general_movement_log', 'printing_movement_log')
    .renameTable('printing_assets_machines', 'printing_store_machines');
};
