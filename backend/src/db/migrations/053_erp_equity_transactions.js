// Migration step 53 of 362
// Creates table: erp_equity_transactions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_equity_transactions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`owner_name\` varchar(255) NOT NULL,
  \`transaction_type\` varchar(255) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`description\` text,
  \`transaction_date\` date NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_equity_transactions');
};
