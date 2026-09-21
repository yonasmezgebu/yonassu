// Migration step 252 of 362
// Creates table: retail_transactions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_transactions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`shift_id\` int(10) unsigned DEFAULT NULL,
  \`invoice_number\` varchar(255) NOT NULL,
  \`total_amount\` decimal(12,2) NOT NULL,
  \`payment_method\` enum('cash','bank_transfer','telebirr','credit') NOT NULL,
  \`payment_ref\` varchar(255) DEFAULT NULL,
  \`discount_percent\` decimal(5,2) DEFAULT '0.00',
  \`discount_amount\` decimal(12,2) DEFAULT '0.00',
  \`customer_phone\` varchar(255) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`is_submitted\` tinyint(1) DEFAULT '0',
  \`sale_type\` varchar(255) DEFAULT 'WALK-IN',
  \`received_by\` varchar(255) DEFAULT NULL,
  \`sender_name\` varchar(255) DEFAULT NULL,
  \`sender_phone\` varchar(255) DEFAULT NULL,
  \`transaction_id\` varchar(255) DEFAULT NULL,
  \`subtotal\` decimal(10,2) DEFAULT NULL,
  \`submission_ref\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`retail_transactions_invoice_number_unique\` (\`invoice_number\`),
  KEY \`retail_transactions_shift_id_foreign\` (\`shift_id\`),
  CONSTRAINT \`retail_transactions_shift_id_foreign\` FOREIGN KEY (\`shift_id\`) REFERENCES \`retail_shifts\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_transactions');
};
