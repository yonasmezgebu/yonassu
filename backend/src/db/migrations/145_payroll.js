// Migration step 145 of 362
// Creates table: payroll
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`month\` varchar(7) NOT NULL,
  \`status\` enum('Draft','Sent','Finance Approved','Paid') DEFAULT 'Draft',
  \`total_base_salary\` decimal(14,2) DEFAULT '0.00',
  \`total_bonus\` decimal(14,2) DEFAULT '0.00',
  \`total_deduction\` decimal(14,2) DEFAULT '0.00',
  \`total_net\` decimal(14,2) DEFAULT '0.00',
  \`employee_count\` int(11) DEFAULT '0',
  \`payment_method\` varchar(30) DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`sent_to_finance_at\` timestamp NULL DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`finance_approved_by\` int(11) DEFAULT NULL,
  \`paid_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`month\` (\`month\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll');
};
