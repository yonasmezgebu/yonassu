// Migration step 27 of 362
// Creates table: cash_handovers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`cash_handovers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`from_user_id\` int(10) unsigned DEFAULT NULL,
  \`to_user_id\` int(10) unsigned DEFAULT NULL,
  \`worker_id\` int(10) unsigned DEFAULT NULL,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`payment_id\` int(10) unsigned DEFAULT NULL,
  \`handover_type\` varchar(40) DEFAULT NULL,
  \`total_cash\` decimal(14,2) DEFAULT NULL,
  \`total_telebirr\` decimal(14,2) DEFAULT NULL,
  \`total_transfer\` decimal(14,2) DEFAULT NULL,
  \`total_credit\` decimal(14,2) DEFAULT NULL,
  \`total_check\` decimal(14,2) DEFAULT NULL,
  \`amount\` decimal(14,2) DEFAULT NULL,
  \`total_amount\` decimal(14,2) DEFAULT NULL,
  \`handed_to\` int(10) unsigned DEFAULT NULL,
  \`handed_over_at\` timestamp NULL DEFAULT NULL,
  \`notes\` text,
  \`status\` varchar(30) DEFAULT 'PENDING',
  \`verified_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cash_handovers');
};
