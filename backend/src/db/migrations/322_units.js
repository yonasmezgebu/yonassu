// Migration step 322 of 362
// Creates table: units
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`units\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`abbreviation\` varchar(10) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('units');
};
