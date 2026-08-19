exports.up = function(knex) {
  return knex.schema.alterTable('sales_invoices', t => {
    t.string('sale_type', 20).nullable().after('source'); // 'online', 'walk_in'
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sales_invoices', t => {
    t.dropColumn('sale_type');
  });
};