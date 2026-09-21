// Migration step 103 of 362
// Creates table: etp_session_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`etp_session_logs\` (
  \`session_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`log_date\` date DEFAULT NULL,
  \`pc_login_time\` datetime DEFAULT NULL,
  \`pc_logout_time\` datetime DEFAULT NULL,
  \`total_idle_seconds\` int(11) DEFAULT '0',
  \`total_active_seconds\` int(11) DEFAULT '0',
  \`source_type\` varchar(20) DEFAULT 'PC_AGENT',
  \`is_override\` varchar(3) DEFAULT 'No',
  \`override_reason\` text,
  \`entry_by\` varchar(50) DEFAULT NULL,
  \`entry_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`session_id\`),
  KEY \`etp_session_logs_employee_id_foreign\` (\`employee_id\`),
  CONSTRAINT \`etp_session_logs_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('etp_session_logs');
};
