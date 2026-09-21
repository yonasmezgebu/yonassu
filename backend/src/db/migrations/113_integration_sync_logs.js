// Migration step 113 of 362
// Creates table: integration_sync_logs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`integration_sync_logs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`integration_key\` varchar(50) NOT NULL,
  \`action\` varchar(100) DEFAULT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'SUCCESS',
  \`detail\` text,
  \`timestamp\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`integration_sync_logs_integration_key_index\` (\`integration_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('integration_sync_logs');
};
