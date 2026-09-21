// Migration step 44 of 362
// Creates table: delegated_nodes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`delegated_nodes\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`parent_id\` int(10) unsigned DEFAULT NULL,
  \`type\` enum('global','region','department') DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('delegated_nodes');
};
