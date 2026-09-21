// Migration step 144 of 362
// Creates table: payment_terms
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`payment_terms\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`days_net\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_terms');
};
