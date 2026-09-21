// Migration step 277 of 362
// Creates table: single_roles
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`single_roles\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`module\` varchar(255) DEFAULT NULL,
  \`function\` varchar(255) DEFAULT NULL,
  \`scope\` varchar(255) DEFAULT NULL,
  \`permissions\` json DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`single_roles_name_unique\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('single_roles');
};
