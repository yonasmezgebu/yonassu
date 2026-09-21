// Migration step 101 of 362
// Creates table: etp_heartbeat_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`etp_heartbeat_logs\` (
  \`heartbeat_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`heartbeat_time\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`status\` varchar(20) DEFAULT 'Online',
  \`active_minutes\` int(11) DEFAULT '0',
  \`idle_minutes\` int(11) DEFAULT '0',
  PRIMARY KEY (\`heartbeat_id\`),
  KEY \`idx_hb_emp_time\` (\`employee_id\`,\`heartbeat_time\`),
  CONSTRAINT \`etp_heartbeat_logs_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('etp_heartbeat_logs');
};
