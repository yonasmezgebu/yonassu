// Migration step 184 of 362
// Creates table: pos_shifts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pos_shifts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`cashier_id\` int(10) unsigned NOT NULL,
  \`shift_type\` enum('morning','afternoon','evening') DEFAULT 'morning',
  \`opening_float\` decimal(12,2) DEFAULT '0.00',
  \`total_sales\` decimal(12,2) DEFAULT '0.00',
  \`transaction_count\` int(11) DEFAULT '0',
  \`cash_collected\` decimal(12,2) DEFAULT '0.00',
  \`telebirr_collected\` decimal(12,2) DEFAULT '0.00',
  \`transfer_collected\` decimal(12,2) DEFAULT '0.00',
  \`credit_collected\` decimal(12,2) DEFAULT '0.00',
  \`check_collected\` decimal(12,2) DEFAULT '0.00',
  \`physical_cash_counted\` decimal(12,2) DEFAULT NULL,
  \`difference_amount\` decimal(12,2) DEFAULT '0.00',
  \`difference_reason\` varchar(255) DEFAULT NULL,
  \`cash_to_handover\` decimal(12,2) DEFAULT '0.00',
  \`status\` enum('OPEN','CLOSED','VERIFIED') DEFAULT 'OPEN',
  \`verified_by\` int(10) unsigned DEFAULT NULL,
  \`verified_at\` timestamp NULL DEFAULT NULL,
  \`opened_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`closed_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_shifts');
};
