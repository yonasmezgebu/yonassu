// Migration step 104 of 362
// Creates table: etp_weekly_summary
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`etp_weekly_summary\` (
  \`summary_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`week_number\` int(11) DEFAULT NULL,
  \`month_number\` int(11) DEFAULT NULL,
  \`year_number\` int(11) DEFAULT NULL,
  \`week_start_date\` date DEFAULT NULL,
  \`week_end_date\` date DEFAULT NULL,
  \`total_worked_hours\` decimal(6,2) DEFAULT '0.00',
  \`total_late_minutes\` int(11) DEFAULT '0',
  \`total_absent_days\` int(11) DEFAULT '0',
  \`total_overtime_hours\` decimal(6,2) DEFAULT '0.00',
  \`calculated_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`summary_id\`),
  UNIQUE KEY \`idx_unique_weekly\` (\`employee_id\`,\`week_number\`,\`year_number\`),
  CONSTRAINT \`etp_weekly_summary_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('etp_weekly_summary');
};
