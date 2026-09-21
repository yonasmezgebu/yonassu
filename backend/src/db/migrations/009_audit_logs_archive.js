// Migration step 9 of 362
// Creates table: audit_logs_archive
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`audit_logs_archive\` (
  \`id\` bigint(20) NOT NULL,
  \`user_id\` int(11) NOT NULL,
  \`action\` varchar(50) NOT NULL,
  \`resource\` varchar(100) NOT NULL,
  \`resource_id\` varchar(255) DEFAULT NULL,
  \`department\` varchar(50) DEFAULT NULL,
  \`before_state\` json DEFAULT NULL,
  \`after_state\` json DEFAULT NULL,
  \`ip_address\` varchar(45) NOT NULL,
  \`user_agent\` text,
  \`status\` varchar(20) DEFAULT 'success',
  \`error_message\` text,
  \`created_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs_archive');
};
