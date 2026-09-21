// Migration step 146 of 362
// Creates table: payroll_company_aggregation
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payroll_company_aggregation\` (
  \`agg_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`month_number\` int(11) DEFAULT NULL,
  \`year_number\` int(11) DEFAULT NULL,
  \`total_employees\` int(11) DEFAULT '0',
  \`company_gross_pay\` decimal(14,2) DEFAULT '0.00',
  \`company_net_pay\` decimal(14,2) DEFAULT '0.00',
  \`total_overtime_pay\` decimal(12,2) DEFAULT '0.00',
  \`total_deductions\` decimal(14,2) DEFAULT '0.00',
  \`total_worked_hours\` decimal(12,2) DEFAULT '0.00',
  \`total_late_hours\` decimal(10,2) DEFAULT '0.00',
  \`total_absent_days\` int(11) DEFAULT '0',
  \`calculated_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`approval_status\` varchar(20) DEFAULT 'Draft',
  \`approved_by\` varchar(50) DEFAULT NULL,
  \`approved_date\` datetime DEFAULT NULL,
  \`rejection_reason\` text,
  \`payment_status\` varchar(20) DEFAULT 'Unpaid',
  \`paid_by\` varchar(50) DEFAULT NULL,
  \`paid_date\` datetime DEFAULT NULL,
  \`payment_method\` varchar(50) DEFAULT NULL,
  PRIMARY KEY (\`agg_id\`),
  UNIQUE KEY \`idx_unique_company_payroll\` (\`month_number\`,\`year_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payroll_company_aggregation');
};
