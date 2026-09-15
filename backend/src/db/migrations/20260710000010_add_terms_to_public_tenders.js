exports.up = function(knex) {
  return knex.schema.table('public_tenders', table => {
    table.text('terms_conditions').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('public_tenders', table => {
    table.dropColumn('terms_conditions');
  });
};