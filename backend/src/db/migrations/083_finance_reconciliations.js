// Migration step 83 of 362
// Creates table: finance_reconciliations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_reconciliations\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`reconciliation_no\` varchar(255) NOT NULL,
  \`account_id\` int(10) unsigned DEFAULT NULL,
  \`period_from\` date NOT NULL,
  \`period_to\` date NOT NULL,
  \`erp_balance\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`actual_balance\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`difference\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`status\` varchar(255) NOT NULL DEFAULT 'Draft',
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`finance_reconciliations_reconciliation_no_unique\` (\`reconciliation_no\`),
  KEY \`finance_reconciliations_account_id_foreign\` (\`account_id\`),
  CONSTRAINT \`finance_reconciliations_account_id_foreign\` FOREIGN KEY (\`account_id\`) REFERENCES \`finance_accounts\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_reconciliations');
};
