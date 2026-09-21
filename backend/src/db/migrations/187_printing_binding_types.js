// Migration step 187 of 362
// Creates table: printing_binding_types
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_binding_types\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`code\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`price\` decimal(10,2) DEFAULT '0.00',
  \`is_active\` tinyint(1) DEFAULT '1',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`printing_binding_types_code_unique\` (\`code\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_binding_types');
};
