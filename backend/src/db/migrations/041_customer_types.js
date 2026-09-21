// Migration step 41 of 362
// Creates table: customer_types
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`customer_types\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`color_code\` varchar(7) NOT NULL DEFAULT '#6B7280',
  \`icon_name\` varchar(50) DEFAULT NULL,
  \`sort_order\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customer_types');
};
