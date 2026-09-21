// Migration step 100 of 362
// Creates table: etp_daily_attendance
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`etp_daily_attendance\` (
  \`record_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`attendance_date\` date DEFAULT NULL,
  \`week_number\` int(11) DEFAULT NULL,
  \`month_number\` int(11) DEFAULT NULL,
  \`year_number\` int(11) DEFAULT NULL,
  \`actual_start_time\` time DEFAULT NULL,
  \`actual_end_time\` time DEFAULT NULL,
  \`net_work_hours\` decimal(6,2) DEFAULT '0.00',
  \`scheduled_hours\` decimal(6,2) DEFAULT '8.00',
  \`late_minutes\` int(11) DEFAULT '0',
  \`early_leave_minutes\` int(11) DEFAULT '0',
  \`overtime_hours\` decimal(6,2) DEFAULT '0.00',
  \`absent_days\` int(11) DEFAULT '0',
  \`attendance_status\` varchar(20) DEFAULT 'Not Recorded',
  \`is_manual_override\` varchar(3) DEFAULT 'No',
  \`override_reason\` text,
  \`calculated_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`auth_method\` enum('ashara','card','face') DEFAULT NULL,
  \`terminal_ip\` varchar(45) DEFAULT NULL,
  PRIMARY KEY (\`record_id\`),
  UNIQUE KEY \`idx_unique_attendance\` (\`employee_id\`,\`attendance_date\`),
  CONSTRAINT \`etp_daily_attendance_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('etp_daily_attendance');
};
