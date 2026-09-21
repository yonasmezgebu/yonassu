// Migration step 81 of 362
// Creates table: finance_payables
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_payables\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`ev_number\` varchar(255) NOT NULL,
  \`date\` date NOT NULL,
  \`paid_to\` varchar(255) NOT NULL,
  \`category\` varchar(255) NOT NULL,
  \`total_amount\` decimal(14,2) NOT NULL,
  \`amount_paid\` decimal(14,2) DEFAULT '0.00',
  \`outstanding_balance\` decimal(14,2) DEFAULT '0.00',
  \`payment_method\` varchar(255) NOT NULL DEFAULT 'Cash',
  \`description\` varchar(255) DEFAULT NULL,
  \`reference_no\` varchar(255) DEFAULT NULL,
  \`status\` varchar(255) DEFAULT 'Paid',
  \`due_date\` date DEFAULT NULL,
  \`bank_details\` text,
  \`telebirr_details\` text,
  \`prepared_by\` text,
  \`checked_by\` text,
  \`payee_name\` text,
  \`prepared_signature\` text,
  \`checked_signature\` text,
  \`payee_signature\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`finance_payables_pv_number_unique\` (\`ev_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_payables');
};
