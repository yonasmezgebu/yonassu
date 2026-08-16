exports.up = async function(knex) {
  // Altering enum column is tricky in mysql, we'll change it to string or redefine enum.
  // We'll change status to string to allow any status.
  await knex.raw("ALTER TABLE general_procurement_requests MODIFY COLUMN status VARCHAR(255) DEFAULT 'PENDING';");
  
  await knex.schema.alterTable('general_procurement_requests', (t) => {
    t.datetime('accepted_at');
    t.datetime('payment_requested_at');
    t.decimal('requested_amount', 15, 2);
    t.datetime('finance_checked_at');
    t.text('finance_note');
    t.datetime('payment_decided_at');
    t.datetime('paid_at');
    t.decimal('paid_amount', 15, 2);
    t.string('tender_reference');
    t.datetime('completed_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('general_procurement_requests', (t) => {
    t.dropColumn('accepted_at');
    t.dropColumn('payment_requested_at');
    t.dropColumn('requested_amount');
    t.dropColumn('finance_checked_at');
    t.dropColumn('finance_note');
    t.dropColumn('payment_decided_at');
    t.dropColumn('paid_at');
    t.dropColumn('paid_amount');
    t.dropColumn('tender_reference');
    t.dropColumn('completed_at');
  });
  
  // Changing back to enum may fail if data is present, but for down migration:
  await knex.raw("ALTER TABLE general_procurement_requests MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAIT') DEFAULT 'PENDING';");
};
