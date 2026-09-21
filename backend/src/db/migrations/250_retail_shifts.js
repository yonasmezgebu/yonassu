// Migration step 250 of 362
// Creates table: retail_shifts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_shifts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`cashier_id\` int(10) unsigned DEFAULT NULL,
  \`shift_type\` enum('morning','afternoon','evening') DEFAULT 'morning',
  \`opening_float\` decimal(12,2) DEFAULT '0.00',
  \`total_sales\` decimal(12,2) DEFAULT '0.00',
  \`transaction_count\` int(11) DEFAULT '0',
  \`cash_collected\` decimal(12,2) DEFAULT '0.00',
  \`telebirr_collected\` decimal(12,2) DEFAULT '0.00',
  \`transfer_collected\` decimal(12,2) DEFAULT '0.00',
  \`credit_collected\` decimal(12,2) DEFAULT '0.00',
  \`physical_cash_counted\` decimal(12,2) DEFAULT NULL,
  \`difference_amount\` decimal(12,2) DEFAULT '0.00',
  \`difference_reason\` varchar(255) DEFAULT NULL,
  \`status\` enum('OPEN','CLOSED','VERIFIED') DEFAULT 'OPEN',
  \`opened_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`closed_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_shifts');
};
