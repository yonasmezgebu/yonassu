// Migration step 118 of 362
// Creates table: knex_migrations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`knex_migrations\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) DEFAULT NULL,
  \`batch\` int(11) DEFAULT NULL,
  \`migration_time\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('knex_migrations');
};
