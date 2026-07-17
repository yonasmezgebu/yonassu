exports.up = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.string('bank_name').nullable();
    table.string('account_holder').nullable();
    table.string('account_number').nullable();
    table.string('cheque_no').nullable();
    table.string('telebirr_number').nullable();
    table.string('telebirr_name').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('finance_pcvs', table => {
    table.dropColumns('bank_name', 'account_holder', 'account_number', 'cheque_no', 'telebirr_number', 'telebirr_name');
  });
};
