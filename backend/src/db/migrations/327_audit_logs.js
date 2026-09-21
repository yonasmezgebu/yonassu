// Migration step 327 of 362
// Creates table: audit_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`audit_logs\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
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
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_audit_user\` (\`user_id\`),
  KEY \`idx_audit_action\` (\`action\`),
  KEY \`idx_audit_resource\` (\`resource\`),
  KEY \`idx_audit_created\` (\`created_at\`),
  CONSTRAINT \`audit_logs_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8240 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
