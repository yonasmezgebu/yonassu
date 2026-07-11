exports.up = function(knex) {
  return knex.schema.alterTable('public_tenders', t => {
    t.boolean('purchase_read').defaultTo(false);
  });
};
exports.down = function(knex) {
  return knex.schema.alterTable('public_tenders', t => {
    t.dropColumn('purchase_read');
  });
};
