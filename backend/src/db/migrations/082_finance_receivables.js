// Migration step 82 of 362
// Creates table: finance_receivables
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_receivables\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`customer_name\` varchar(255) NOT NULL,
  \`invoice_no\` varchar(255) DEFAULT NULL,
  \`invoice_date\` date NOT NULL,
  \`due_date\` date NOT NULL,
  \`total_amount\` decimal(14,2) NOT NULL,
  \`amount_paid\` decimal(14,2) DEFAULT '0.00',
  \`outstanding_balance\` decimal(14,2) DEFAULT '0.00',
  \`status\` varchar(255) DEFAULT 'Unpaid',
  \`department_source\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`manual_details\` longtext,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_receivables');
};
