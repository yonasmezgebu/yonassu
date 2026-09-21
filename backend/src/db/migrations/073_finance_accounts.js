// Migration step 73 of 362
// Creates table: finance_accounts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_accounts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`account_name\` varchar(255) NOT NULL,
  \`account_type\` varchar(255) NOT NULL,
  \`bank_provider\` varchar(255) DEFAULT NULL,
  \`account_number\` varchar(255) DEFAULT NULL,
  \`branch\` varchar(255) DEFAULT NULL,
  \`currency\` varchar(255) NOT NULL DEFAULT 'ETB',
  \`opening_balance\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`opening_balance_date\` date NOT NULL,
  \`status\` varchar(255) NOT NULL DEFAULT 'Active',
  \`description\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_accounts');
};
