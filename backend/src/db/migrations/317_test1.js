// Migration step 317 of 362
// Creates table: test1
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`test1\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('test1');
};
