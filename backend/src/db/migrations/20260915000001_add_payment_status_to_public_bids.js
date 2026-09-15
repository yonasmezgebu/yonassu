exports.up = function(knex) {
  return knex.schema.alterTable('public_bids', table => {
    table.string('payment_status').defaultTo('pending');
    table.boolean('customer_cancelled').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('public_bids', table => {
    table.dropColumn('payment_status');
    table.dropColumn('customer_cancelled');
  });
};
