// Migration step 86 of 362
// Creates table: fund_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`fund_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`fund_request_code\` varchar(255) NOT NULL,
  \`created_by\` int(10) unsigned NOT NULL,
  \`status\` enum('PENDING_APPROVAL','APPROVED','REJECTED','READY_FOR_PAYMENT') DEFAULT 'PENDING_APPROVAL',
  \`total_amount\` decimal(15,2) DEFAULT '0.00',
  \`decided_by\` int(10) unsigned DEFAULT NULL,
  \`decision_reason\` text,
  \`decided_at\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`is_new_drug\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`fund_requests_fund_request_code_unique\` (\`fund_request_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fund_requests');
};
