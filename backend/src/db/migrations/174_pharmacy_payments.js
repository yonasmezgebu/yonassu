// Migration step 174 of 362
// Creates table: pharmacy_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`sale_id\` int(10) unsigned DEFAULT NULL,
  \`payment_method\` enum('CASH','BANK_TRANSFER','TELBIR') NOT NULL,
  \`amount\` decimal(12,2) DEFAULT '0.00',
  \`recipient_name\` varchar(200) DEFAULT NULL,
  \`recipient_phone\` varchar(30) DEFAULT NULL,
  \`bank_name\` varchar(100) DEFAULT NULL,
  \`account_holder\` varchar(200) DEFAULT NULL,
  \`account_number\` varchar(100) DEFAULT NULL,
  \`telbir_number\` varchar(50) DEFAULT NULL,
  \`branch_name\` varchar(100) DEFAULT NULL,
  \`worker_name\` varchar(150) DEFAULT NULL,
  \`status\` enum('PAID','CASHOUT') DEFAULT 'PAID',
  \`receipt_no\` varchar(50) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_payments_sale_id_foreign\` (\`sale_id\`),
  CONSTRAINT \`pharmacy_payments_sale_id_foreign\` FOREIGN KEY (\`sale_id\`) REFERENCES \`pharmacy_sales\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_payments');
};
