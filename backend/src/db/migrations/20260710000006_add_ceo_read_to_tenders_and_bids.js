exports.up = function(knex) {
  return knex.schema
    .table('public_tenders', table => {
      table.boolean('ceo_read').defaultTo(false);
    })
    .table('public_bids', table => {
      table.boolean('ceo_read').defaultTo(false);
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('public_bids', table => {
      table.dropColumn('ceo_read');
    })
    .table('public_tenders', table => {
      table.dropColumn('ceo_read');
    });
};
