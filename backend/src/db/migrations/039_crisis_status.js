// Migration step 39 of 362
// Creates table: crisis_status
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`crisis_status\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`is_active\` tinyint(1) DEFAULT '0',
  \`activated_at\` timestamp NULL DEFAULT NULL,
  \`activated_by\` varchar(100) DEFAULT NULL,
  \`deactivated_at\` timestamp NULL DEFAULT NULL,
  \`reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('crisis_status');
};
