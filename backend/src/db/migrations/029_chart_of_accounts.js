// Migration step 29 of 362
// Creates table: chart_of_accounts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`chart_of_accounts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`account_code\` varchar(20) NOT NULL,
  \`account_name\` varchar(200) NOT NULL,
  \`account_type\` enum('asset','liability','equity','revenue','expense') NOT NULL,
  \`account_class\` varchar(50) DEFAULT NULL,
  \`parent_id\` int(10) unsigned DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`is_control_account\` tinyint(1) DEFAULT '0',
  \`description\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`chart_of_accounts_account_code_unique\` (\`account_code\`),
  KEY \`chart_of_accounts_parent_id_foreign\` (\`parent_id\`),
  CONSTRAINT \`chart_of_accounts_parent_id_foreign\` FOREIGN KEY (\`parent_id\`) REFERENCES \`chart_of_accounts\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('chart_of_accounts');
};
