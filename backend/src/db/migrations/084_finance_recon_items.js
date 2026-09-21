// Migration step 84 of 362
// Creates table: finance_recon_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_recon_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`reconciliation_id\` int(10) unsigned DEFAULT NULL,
  \`transaction_date\` date DEFAULT NULL,
  \`reference_no\` varchar(255) DEFAULT NULL,
  \`transaction_type\` varchar(255) DEFAULT NULL,
  \`description\` varchar(255) DEFAULT NULL,
  \`erp_amount\` decimal(15,2) DEFAULT '0.00',
  \`actual_amount\` decimal(15,2) DEFAULT '0.00',
  \`difference\` decimal(15,2) DEFAULT '0.00',
  \`match_status\` varchar(255) DEFAULT 'Unmatched',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`finance_recon_items_reconciliation_id_foreign\` (\`reconciliation_id\`),
  CONSTRAINT \`finance_recon_items_reconciliation_id_foreign\` FOREIGN KEY (\`reconciliation_id\`) REFERENCES \`finance_reconciliations\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_recon_items');
};
