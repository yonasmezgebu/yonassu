// Migration step 148 of 362
// Creates table: payroll_finance_queue
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll_finance_queue\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`month_number\` int(11) NOT NULL,
  \`year_number\` int(11) NOT NULL,
  \`total_net_pay\` decimal(15,2) DEFAULT NULL,
  \`total_employees\` int(11) DEFAULT NULL,
  \`approved_by_ceo\` varchar(255) DEFAULT NULL,
  \`ceo_approved_date\` datetime DEFAULT NULL,
  \`payment_status\` varchar(255) DEFAULT 'Pending Payment',
  \`payment_method\` varchar(255) DEFAULT NULL,
  \`paid_by\` varchar(255) DEFAULT NULL,
  \`paid_date\` datetime DEFAULT NULL,
  \`proof_file\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`payroll_finance_queue_month_number_year_number_unique\` (\`month_number\`,\`year_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll_finance_queue');
};
