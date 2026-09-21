// Migration step 77 of 362
// Creates table: finance_evs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_evs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`ev_number\` varchar(255) NOT NULL,
  \`date\` date NOT NULL,
  \`paid_to\` varchar(255) NOT NULL,
  \`amount\` decimal(14,2) NOT NULL,
  \`payment_method\` varchar(255) NOT NULL DEFAULT 'Cash',
  \`description\` varchar(255) NOT NULL,
  \`reference_no\` varchar(255) DEFAULT NULL,
  \`bank_name\` varchar(255) DEFAULT NULL,
  \`account_holder\` varchar(255) DEFAULT NULL,
  \`account_number\` varchar(255) DEFAULT NULL,
  \`cheque_no\` varchar(255) DEFAULT NULL,
  \`telebirr_number\` varchar(255) DEFAULT NULL,
  \`telebirr_name\` varchar(255) DEFAULT NULL,
  \`prepared_by\` varchar(255) DEFAULT NULL,
  \`checked_by\` varchar(255) DEFAULT NULL,
  \`receiver_name\` varchar(255) DEFAULT NULL,
  \`prepared_signature\` text,
  \`checked_signature\` text,
  \`receiver_signature\` text,
  \`status\` varchar(255) NOT NULL DEFAULT 'pending_ceo',
  \`reject_reason\` text,
  \`ceo_read\` tinyint(1) NOT NULL DEFAULT '0',
  \`finance_read\` tinyint(1) NOT NULL DEFAULT '0',
  \`source\` varchar(255) DEFAULT NULL,
  \`source_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`finance_evs_ev_number_unique\` (\`ev_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_evs');
};
