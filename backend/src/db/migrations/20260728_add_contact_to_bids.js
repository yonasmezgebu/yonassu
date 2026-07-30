exports.up = function(knex) {
  return knex.schema.alterTable('bids', table => {
    table.string('bidder_full_name').nullable();
    table.string('bidder_email').nullable();
    table.string('bidder_phone').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bids', table => {
    table.dropColumn('bidder_full_name');
    table.dropColumn('bidder_email');
    table.dropColumn('bidder_phone');
  });
};
