// Migration step 30 of 362
// Creates table: communication_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`communication_logs\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
  \`type\` varchar(10) NOT NULL,
  \`recipient\` varchar(255) NOT NULL,
  \`subject\` varchar(500) DEFAULT NULL,
  \`content\` text NOT NULL,
  \`status\` varchar(20) DEFAULT 'pending',
  \`provider_response\` text,
  \`retry_count\` int(11) DEFAULT '0',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`sent_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_logs_type\` (\`type\`),
  KEY \`idx_logs_status\` (\`status\`),
  KEY \`idx_logs_created\` (\`created_at\`),
  KEY \`idx_logs_recipient\` (\`recipient\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('communication_logs');
};
