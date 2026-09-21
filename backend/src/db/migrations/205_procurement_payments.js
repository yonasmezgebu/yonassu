// Migration step 205 of 362
// Creates table: procurement_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`payment_no\` varchar(30) NOT NULL,
  \`fund_request_id\` int(10) unsigned NOT NULL,
  \`pr_no\` varchar(30) NOT NULL,
  \`tender_no\` varchar(30) NOT NULL,
  \`supplier_user_id\` int(11) DEFAULT NULL,
  \`supplier_name\` varchar(255) DEFAULT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`payment_method\` enum('BANK_TRANSFER','CASH','CHECK','TELEBIRR') DEFAULT 'BANK_TRANSFER',
  \`status\` enum('PENDING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
  \`transaction_ref\` varchar(100) DEFAULT NULL,
  \`payment_date\` date DEFAULT NULL,
  \`paid_by\` int(11) NOT NULL,
  \`paid_by_name\` varchar(100) DEFAULT NULL,
  \`paid_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`new_drug_flag\` varchar(10) DEFAULT 'NO',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`procurement_payments_payment_no_unique\` (\`payment_no\`),
  KEY \`procurement_payments_fund_request_id_foreign\` (\`fund_request_id\`),
  CONSTRAINT \`procurement_payments_fund_request_id_foreign\` FOREIGN KEY (\`fund_request_id\`) REFERENCES \`procurement_fund_requests\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_payments');
};
