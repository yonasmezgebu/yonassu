exports.up = function(knex) {
  return knex.schema.alterTable('suppliers', (table) => {
    table.string('tax_id').nullable();
    table.string('payment_terms').nullable();
    table.decimal('credit_limit', 14, 2).nullable();
    table.string('location_type').nullable();
    table.string('bank_name').nullable();
    table.string('bank_account').nullable();
    table.string('bank_holder').nullable();
    table.string('website').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('suppliers', (table) => {
    table.dropColumn('tax_id');
    table.dropColumn('payment_terms');
    table.dropColumn('credit_limit');
    table.dropColumn('location_type');
    table.dropColumn('bank_name');
    table.dropColumn('bank_account');
    table.dropColumn('bank_holder');
    table.dropColumn('website');
  });
};
