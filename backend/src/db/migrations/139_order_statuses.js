// Migration step 139 of 362
// Creates table: order_statuses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`order_statuses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`status_code\` varchar(50) NOT NULL,
  \`status_name\` varchar(100) NOT NULL,
  \`color_hex\` varchar(7) NOT NULL,
  \`sort_order\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`status_code\` (\`status_code\`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_statuses');
};
