// Migration step 358 of 362
// Creates table: three_way_matches
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`three_way_matches\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`expense_id\` int(11) DEFAULT NULL,
  \`po_id\` int(11) NOT NULL,
  \`grn_id\` int(10) unsigned DEFAULT NULL,
  \`match_status\` enum('pending','matched','mismatch','partial') DEFAULT 'pending',
  \`po_amount\` decimal(15,2) DEFAULT NULL,
  \`grn_amount\` decimal(15,2) DEFAULT NULL,
  \`invoice_amount\` decimal(15,2) DEFAULT NULL,
  \`variance_amount\` decimal(15,2) DEFAULT NULL,
  \`variance_reason\` text,
  \`matched_by\` int(10) unsigned DEFAULT NULL,
  \`matched_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`three_way_matches_expense_id_foreign\` (\`expense_id\`),
  KEY \`three_way_matches_po_id_foreign\` (\`po_id\`),
  CONSTRAINT \`three_way_matches_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`three_way_matches_po_id_foreign\` FOREIGN KEY (\`po_id\`) REFERENCES \`purchase_orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('three_way_matches');
};
