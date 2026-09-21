// Migration step 351 of 362
// Creates table: payroll_records
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll_records\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`payroll_month\` varchar(7) NOT NULL,
  \`employee_id\` varchar(20) NOT NULL,
  \`base_salary\` decimal(12,2) NOT NULL,
  \`days_present\` decimal(4,2) NOT NULL,
  \`daily_rate\` decimal(12,2) NOT NULL,
  \`deduction_amount\` decimal(12,2) DEFAULT '0.00',
  \`bonus_amount\` decimal(12,2) DEFAULT '0.00',
  \`net_salary\` decimal(12,2) NOT NULL,
  \`status\` enum('Draft','Approved_HR','Approved_Finance','Paid') DEFAULT 'Draft',
  \`payment_method\` enum('Cash','Bank Transfer','Telebirr') DEFAULT NULL,
  \`paid_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_employee_month\` (\`employee_id\`,\`payroll_month\`),
  CONSTRAINT \`payroll_records_ibfk_1\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll_records');
};
