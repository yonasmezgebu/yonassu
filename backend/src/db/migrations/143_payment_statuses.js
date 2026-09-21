// Migration step 143 of 362
// Creates table: payment_statuses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payment_statuses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`status_code\` varchar(50) NOT NULL,
  \`status_name\` varchar(100) NOT NULL,
  \`color_hex\` varchar(7) NOT NULL,
  \`sort_order\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`status_code\` (\`status_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_statuses');
};
