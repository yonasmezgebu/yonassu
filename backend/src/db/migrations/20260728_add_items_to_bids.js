exports.up = function(knex) {
  return knex.schema.table('bids', table => {
    table.json('items').nullable();
    table.string('ceo_approval_status').defaultTo('pending');
  });
};

exports.down = function(knex) {
  return knex.schema.table('bids', table => {
    table.dropColumn('items');
    table.dropColumn('ceo_approval_status');
  });
};
