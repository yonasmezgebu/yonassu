// Migration step 216 of 362
// Creates table: public_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`fund_request_id\` int(10) unsigned NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`status\` enum('PENDING','PAID') DEFAULT 'PENDING',
  \`paid_by\` int(10) unsigned DEFAULT NULL,
  \`paid_at\` datetime DEFAULT NULL,
  \`receipt_code\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`public_payments_receipt_code_unique\` (\`receipt_code\`),
  UNIQUE KEY \`public_payments_fund_request_id_status_unique\` (\`fund_request_id\`,\`status\`),
  CONSTRAINT \`public_payments_fund_request_id_foreign\` FOREIGN KEY (\`fund_request_id\`) REFERENCES \`public_fund_requests\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_payments');
};
