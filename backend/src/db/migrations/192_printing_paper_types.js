// Migration step 192 of 362
// Creates table: printing_paper_types
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_paper_types\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`code\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`base_price\` decimal(10,2) DEFAULT '0.00',
  \`color_multiplier\` decimal(5,2) DEFAULT '2.00',
  \`is_active\` tinyint(1) DEFAULT '1',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`printing_paper_types_code_unique\` (\`code\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_paper_types');
};
