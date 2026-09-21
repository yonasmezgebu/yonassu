// Migration step 257 of 362
// Creates table: roles
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`roles\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`description\` text,
  \`is_custom\` tinyint(1) NOT NULL DEFAULT '0',
  \`branch_scoped\` tinyint(1) NOT NULL DEFAULT '0',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`permissions\` json NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('roles');
};
