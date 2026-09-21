// Migration step 215 of 362
// Creates table: public_fund_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_fund_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(255) NOT NULL,
  \`status\` enum('PENDING_CEO','APPROVED','REJECTED','READY_FOR_PAYMENT') DEFAULT 'PENDING_CEO',
  \`total_amount\` decimal(15,2) DEFAULT '0.00',
  \`created_by\` int(10) unsigned NOT NULL,
  \`decided_by\` int(10) unsigned DEFAULT NULL,
  \`decision_reason\` text,
  \`decided_at\` datetime DEFAULT NULL,
  \`ceo_read\` tinyint(1) DEFAULT '0',
  \`finance_read\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`public_fund_requests_request_code_unique\` (\`request_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_fund_requests');
};
