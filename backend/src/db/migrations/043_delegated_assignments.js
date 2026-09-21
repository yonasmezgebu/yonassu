// Migration step 43 of 362
// Creates table: delegated_assignments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`delegated_assignments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`node_id\` int(10) unsigned DEFAULT NULL,
  \`admin_id\` int(10) unsigned DEFAULT NULL,
  \`capability\` varchar(20) DEFAULT NULL,
  \`assigned_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('delegated_assignments');
};
