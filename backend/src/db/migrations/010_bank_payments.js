// Migration step 10 of 362
// Creates table: bank_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`bank_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`payment_id\` varchar(255) NOT NULL,
  \`reference\` varchar(255) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`customer_name\` varchar(255) DEFAULT NULL,
  \`customer_phone\` varchar(255) DEFAULT NULL,
  \`bank_code\` varchar(255) NOT NULL,
  \`status\` enum('pending','completed','failed') DEFAULT 'pending',
  \`description\` text,
  \`completed_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`bank_payments_payment_id_unique\` (\`payment_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('bank_payments');
};
