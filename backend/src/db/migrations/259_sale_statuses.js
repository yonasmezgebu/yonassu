// Migration step 259 of 362
// Creates table: sale_statuses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sale_statuses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`status_code\` varchar(50) NOT NULL,
  \`status_name\` varchar(100) NOT NULL,
  \`color_hex\` varchar(7) NOT NULL,
  \`sort_order\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`status_code\` (\`status_code\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sale_statuses');
};
