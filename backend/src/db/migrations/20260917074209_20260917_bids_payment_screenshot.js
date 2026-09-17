exports.up = function(knex) {
  return knex.schema.alterTable('bids', table => {
    table.string('payment_screenshot');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bids', table => {
    table.dropColumn('payment_screenshot');
  });
};
