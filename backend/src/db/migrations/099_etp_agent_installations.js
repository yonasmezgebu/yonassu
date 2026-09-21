// Migration step 99 of 362
// Creates table: etp_agent_installations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`etp_agent_installations\` (
  \`agent_id\` varchar(20) NOT NULL,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`pc_name\` varchar(100) DEFAULT NULL,
  \`mac_address\` varchar(50) DEFAULT NULL,
  \`ip_address\` varchar(50) DEFAULT NULL,
  \`last_heartbeat\` datetime DEFAULT NULL,
  \`agent_version\` varchar(20) DEFAULT '1.0.0',
  \`installation_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`status\` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (\`agent_id\`),
  KEY \`etp_agent_installations_employee_id_foreign\` (\`employee_id\`),
  CONSTRAINT \`etp_agent_installations_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('etp_agent_installations');
};
