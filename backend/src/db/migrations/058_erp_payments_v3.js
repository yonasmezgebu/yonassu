// Migration step 58 of 362
// Creates table: erp_payments_v3
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_payments_v3\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned DEFAULT NULL,
  \`payment_date\` date NOT NULL,
  \`amount\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`payment_method\` varchar(255) NOT NULL DEFAULT 'Cash',
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_payments_v3');
};
