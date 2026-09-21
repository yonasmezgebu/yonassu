// Migration step 206 of 362
// Creates table: procurement_receipts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_receipts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`receipt_no\` varchar(30) NOT NULL,
  \`payment_id\` int(10) unsigned NOT NULL,
  \`payment_no\` varchar(30) NOT NULL,
  \`procurement_request_id\` int(10) unsigned NOT NULL,
  \`pr_no\` varchar(30) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity_ordered\` int(11) NOT NULL,
  \`quantity_received\` int(11) NOT NULL,
  \`condition\` enum('GOOD','DAMAGED','PARTIAL') DEFAULT 'GOOD',
  \`discrepancy_notes\` text,
  \`status\` enum('PENDING','COMPLETED') DEFAULT 'PENDING',
  \`received_by\` int(11) NOT NULL,
  \`received_by_name\` varchar(100) DEFAULT NULL,
  \`received_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`procurement_receipts_receipt_no_unique\` (\`receipt_no\`),
  KEY \`procurement_receipts_payment_id_foreign\` (\`payment_id\`),
  CONSTRAINT \`procurement_receipts_payment_id_foreign\` FOREIGN KEY (\`payment_id\`) REFERENCES \`procurement_payments\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_receipts');
};
