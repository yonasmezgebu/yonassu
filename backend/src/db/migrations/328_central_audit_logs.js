// Migration step 328 of 362
// Creates table: central_audit_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`central_audit_logs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`user_name\` varchar(150) DEFAULT NULL,
  \`role\` varchar(100) DEFAULT NULL,
  \`department\` varchar(100) DEFAULT NULL,
  \`module\` varchar(100) NOT NULL,
  \`action\` varchar(150) NOT NULL,
  \`record_identifier\` varchar(255) DEFAULT NULL,
  \`previous_value\` json DEFAULT NULL,
  \`new_value\` json DEFAULT NULL,
  \`ip_address\` varchar(50) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`central_audit_logs_user_id_foreign\` (\`user_id\`),
  CONSTRAINT \`central_audit_logs_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2982 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('central_audit_logs');
};
