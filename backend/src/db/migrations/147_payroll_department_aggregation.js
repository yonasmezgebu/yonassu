// Migration step 147 of 362
// Creates table: payroll_department_aggregation
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll_department_aggregation\` (
  \`agg_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`dept_id\` varchar(20) DEFAULT NULL,
  \`month_number\` int(11) DEFAULT NULL,
  \`year_number\` int(11) DEFAULT NULL,
  \`employee_count\` int(11) DEFAULT '0',
  \`total_gross_pay\` decimal(12,2) DEFAULT '0.00',
  \`total_net_pay\` decimal(12,2) DEFAULT '0.00',
  \`total_overtime_pay\` decimal(12,2) DEFAULT '0.00',
  \`total_deductions\` decimal(12,2) DEFAULT '0.00',
  \`total_worked_hours\` decimal(10,2) DEFAULT '0.00',
  \`total_late_hours\` decimal(10,2) DEFAULT '0.00',
  \`total_absent_days\` int(11) DEFAULT '0',
  \`calculated_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`agg_id\`),
  UNIQUE KEY \`idx_unique_dept_payroll\` (\`dept_id\`,\`month_number\`,\`year_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll_department_aggregation');
};
