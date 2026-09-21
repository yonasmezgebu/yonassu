// Migration step 263 of 362
// Creates table: sales_receipts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_receipts\` (
  \`id\` varchar(50) NOT NULL,
  \`receipt_no\` varchar(50) NOT NULL,
  \`invoice_id\` varchar(50) NOT NULL,
  \`amount_paid\` decimal(15,2) NOT NULL,
  \`payment_method\` varchar(50) DEFAULT NULL,
  \`payment_reference\` varchar(100) DEFAULT NULL,
  \`received_by_name\` varchar(255) DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`sales_receipts_receipt_no_unique\` (\`receipt_no\`),
  KEY \`sales_receipts_invoice_id_foreign\` (\`invoice_id\`),
  CONSTRAINT \`sales_receipts_invoice_id_foreign\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`sales_invoices\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_receipts');
};
