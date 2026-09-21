// Migration step 274 of 362
// Creates table: settings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`setting_key\` varchar(100) NOT NULL,
  \`setting_value\` text NOT NULL,
  \`category\` varchar(50) NOT NULL,
  \`description\` text,
  \`updated_by\` int(11) DEFAULT NULL,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`setting_key\` (\`setting_key\`),
  KEY \`idx_settings_key\` (\`setting_key\`),
  KEY \`idx_settings_category\` (\`category\`),
  KEY \`updated_by\` (\`updated_by\`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('settings');
};
