// Migration step 279 of 362
// Creates table: sod_rules
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sod_rules\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`function_a\` varchar(255) DEFAULT NULL,
  \`function_b\` varchar(255) DEFAULT NULL,
  \`severity\` enum('CRITICAL','HIGH','MEDIUM','LOW') DEFAULT NULL,
  \`description\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sod_rules');
};
