exports.up = function(knex) {
  return knex.schema.table('finance_crvs', table => {
    table.string('prepared_by').nullable();
    table.string('checked_by').nullable();
    table.string('receiver_name').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('finance_crvs', table => {
    table.dropColumn('prepared_by');
    table.dropColumn('checked_by');
    table.dropColumn('receiver_name');
  });
};
