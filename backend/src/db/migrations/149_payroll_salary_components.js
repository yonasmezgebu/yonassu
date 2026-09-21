// Migration step 149 of 362
// Creates table: payroll_salary_components
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll_salary_components\` (
  \`component_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`month_number\` int(11) DEFAULT NULL,
  \`year_number\` int(11) DEFAULT NULL,
  \`base_salary\` decimal(12,2) DEFAULT '0.00',
  \`housing_allowance\` decimal(12,2) DEFAULT '0.00',
  \`transport_allowance\` decimal(12,2) DEFAULT '0.00',
  \`communication_allowance\` decimal(12,2) DEFAULT '0.00',
  \`overtime_pay\` decimal(12,2) DEFAULT '0.00',
  \`bonus_pay\` decimal(12,2) DEFAULT '0.00',
  \`deduction_absent\` decimal(12,2) DEFAULT '0.00',
  \`deduction_loan\` decimal(12,2) DEFAULT '0.00',
  \`deduction_tax\` decimal(12,2) DEFAULT '0.00',
  \`deduction_pension\` decimal(12,2) DEFAULT '0.00',
  \`gross_pay\` decimal(12,2) DEFAULT '0.00',
  \`net_pay\` decimal(12,2) DEFAULT '0.00',
  \`calculated_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`status\` varchar(20) DEFAULT 'Draft',
  \`approved_by\` varchar(50) DEFAULT NULL,
  \`approved_date\` datetime DEFAULT NULL,
  PRIMARY KEY (\`component_id\`),
  UNIQUE KEY \`idx_unique_payroll\` (\`employee_id\`,\`month_number\`,\`year_number\`),
  CONSTRAINT \`payroll_salary_components_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll_salary_components');
};
