// Migration step 119 of 362
// Creates table: knex_migrations_lock
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`knex_migrations_lock\` (
  \`index\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`is_locked\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`index\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('knex_migrations_lock');
};
