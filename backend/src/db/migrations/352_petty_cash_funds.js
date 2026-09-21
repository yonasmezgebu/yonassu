// Migration step 352 of 362
// Creates table: petty_cash_funds
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`petty_cash_funds\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`fund_name\` varchar(100) NOT NULL,
  \`imprest_amount\` decimal(15,2) NOT NULL,
  \`current_balance\` decimal(15,2) NOT NULL,
  \`max_disbursement\` decimal(15,2) DEFAULT '5000.00',
  \`max_per_transaction\` decimal(15,2) DEFAULT '2000.00',
  \`custodian_id\` int(11) NOT NULL,
  \`status\` enum('active','suspended','closed') DEFAULT 'active',
  \`last_reconciled_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`petty_cash_funds_custodian_id_foreign\` (\`custodian_id\`),
  CONSTRAINT \`petty_cash_funds_custodian_id_foreign\` FOREIGN KEY (\`custodian_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('petty_cash_funds');
};
