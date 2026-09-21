// Migration step 342 of 362
// Creates table: hr_audit_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_audit_logs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`actor_id\` int(11) DEFAULT NULL,
  \`action\` varchar(255) NOT NULL,
  \`target_module\` varchar(255) NOT NULL,
  \`target_id\` varchar(255) NOT NULL,
  \`before_state\` json DEFAULT NULL,
  \`after_state\` json DEFAULT NULL,
  \`ip_address\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`hr_audit_logs_actor_id_foreign\` (\`actor_id\`),
  CONSTRAINT \`hr_audit_logs_actor_id_foreign\` FOREIGN KEY (\`actor_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_audit_logs');
};
