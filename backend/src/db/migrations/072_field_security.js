// Migration step 72 of 362
// Creates table: field_security
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`field_security\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`module\` varchar(255) DEFAULT NULL,
  \`field_name\` varchar(255) DEFAULT NULL,
  \`sensitivity\` varchar(10) DEFAULT 'L0',
  \`mask_rule\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('field_security');
};
