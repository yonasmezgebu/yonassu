// Migration step 112 of 362
// Creates table: integration_settings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`integration_settings\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`integration_key\` varchar(50) NOT NULL,
  \`config\` text,
  \`status\` varchar(20) NOT NULL DEFAULT 'disconnected',
  \`enabled\` tinyint(1) NOT NULL DEFAULT '0',
  \`last_sync_at\` timestamp NULL DEFAULT NULL,
  \`connected_at\` timestamp NULL DEFAULT NULL,
  \`updated_by\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`integration_settings_integration_key_unique\` (\`integration_key\`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('integration_settings');
};
