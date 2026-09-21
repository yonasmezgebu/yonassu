// Migration step 353 of 362
// Creates table: petty_cash_transactions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`petty_cash_transactions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`fund_id\` int(10) unsigned NOT NULL,
  \`type\` enum('disbursement','replenishment','adjustment','transfer') NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`category_id\` int(11) DEFAULT NULL,
  \`description\` text NOT NULL,
  \`receipt_path\` varchar(255) DEFAULT NULL,
  \`requested_by\` int(10) unsigned DEFAULT NULL,
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`status\` enum('pending','approved','rejected','paid') DEFAULT 'pending',
  \`paid_at\` timestamp NULL DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`petty_cash_transactions_fund_id_foreign\` (\`fund_id\`),
  KEY \`petty_cash_transactions_category_id_foreign\` (\`category_id\`),
  CONSTRAINT \`petty_cash_transactions_category_id_foreign\` FOREIGN KEY (\`category_id\`) REFERENCES \`expense_categories\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`petty_cash_transactions_fund_id_foreign\` FOREIGN KEY (\`fund_id\`) REFERENCES \`petty_cash_funds\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('petty_cash_transactions');
};
