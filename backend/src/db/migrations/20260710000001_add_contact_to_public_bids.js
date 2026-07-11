exports.up = function(knex) {
  return knex.schema.table('public_bids', table => {
    table.string('email');
    table.string('phone');
  });
};

exports.down = function(knex) {
  return knex.schema.table('public_bids', table => {
    table.dropColumn('email');
    table.dropColumn('phone');
  });
};
