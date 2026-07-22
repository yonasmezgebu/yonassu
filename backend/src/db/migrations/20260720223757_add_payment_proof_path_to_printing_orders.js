exports.up = function(knex) {
  return knex.schema.alterTable('printing_orders', table => {
    table.string('payment_proof_path').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('printing_orders', table => {
    table.dropColumn('payment_proof_path');
  });
};
