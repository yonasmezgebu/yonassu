// Migration step 141 of 362
// Creates table: payment_methods
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payment_methods\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`requires_reference\` tinyint(1) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_methods');
};
