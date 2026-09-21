// Migration step 318 of 362
// Creates table: test2
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`test2\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`test1_id\` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`test2_test1_id_foreign\` (\`test1_id\`),
  CONSTRAINT \`test2_test1_id_foreign\` FOREIGN KEY (\`test1_id\`) REFERENCES \`test1\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('test2');
};
