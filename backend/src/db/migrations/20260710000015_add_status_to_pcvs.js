exports.up = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.string('status').notNullable().defaultTo('pending_ceo'); // pending_ceo, approved_finance, rejected, completed
    table.text('reject_reason').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.dropColumn('status');
    table.dropColumn('reject_reason');
  });
};
