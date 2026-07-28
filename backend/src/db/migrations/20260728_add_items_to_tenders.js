exports.up = function(knex) {
  return knex.schema.table('tenders', table => {
    table.json('items').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('tenders', table => {
    table.dropColumn('items');
  });
};
