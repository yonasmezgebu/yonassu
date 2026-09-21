// Migration step 350 of 362
// Creates table: payroll_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`payroll_id\` int(11) NOT NULL,
  \`employee_id\` varchar(20) NOT NULL,
  \`base_salary\` decimal(12,2) DEFAULT '0.00',
  \`daily_rate\` decimal(12,2) DEFAULT '0.00',
  \`days_present\` decimal(4,2) DEFAULT '0.00',
  \`days_absent\` decimal(4,2) DEFAULT '0.00',
  \`late_minutes\` int(11) DEFAULT '0',
  \`absence_deduction\` decimal(12,2) DEFAULT '0.00',
  \`late_deduction\` decimal(12,2) DEFAULT '0.00',
  \`early_leave_deduction\` decimal(12,2) DEFAULT '0.00',
  \`standing_deduction\` decimal(12,2) DEFAULT '0.00',
  \`overtime_hours\` decimal(5,2) DEFAULT '0.00',
  \`overtime_pay\` decimal(12,2) DEFAULT '0.00',
  \`performance_bonus\` decimal(12,2) DEFAULT '0.00',
  \`net_salary\` decimal(12,2) DEFAULT '0.00',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`payroll_id\` (\`payroll_id\`),
  KEY \`employee_id\` (\`employee_id\`),
  CONSTRAINT \`payroll_items_ibfk_1\` FOREIGN KEY (\`payroll_id\`) REFERENCES \`payroll\` (\`id\`),
  CONSTRAINT \`payroll_items_ibfk_2\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll_items');
};
