exports.up = function(knex) {
  return knex.schema.table('finance_crvs', table => {
    table.text('prepared_signature', 'longtext').nullable();
    table.text('checked_signature', 'longtext').nullable();
    table.text('receiver_signature', 'longtext').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('finance_crvs', table => {
    table.dropColumn('prepared_signature');
    table.dropColumn('checked_signature');
    table.dropColumn('receiver_signature');
  });
};
