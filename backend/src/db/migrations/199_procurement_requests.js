// Migration step 199 of 362
// Creates table: procurement_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`pr_no\` varchar(30) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`unit_of_measure\` varchar(50) DEFAULT 'Each',
  \`estimated_unit_price\` decimal(15,2) DEFAULT NULL,
  \`estimated_total\` decimal(15,2) DEFAULT NULL,
  \`justification\` text,
  \`current_stock\` int(11) DEFAULT '0',
  \`reorder_level\` int(11) DEFAULT '0',
  \`urgency\` enum('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
  \`status\` enum('DRAFT','PENDING_CEO_REVIEW','CEO_APPROVED','CEO_REJECTED','IN_MARKET','TENDER_CREATED','FUND_REQUESTED','FUND_APPROVED','PAYMENT_MADE','SHIPPED','RECEIVED','CANCELLED') DEFAULT 'DRAFT',
  \`ceo_decision\` enum('PENDING','APPROVED','REJECTED','WAIT') NOT NULL DEFAULT 'PENDING',
  \`ceo_notes\` text,
  \`ceo_decided_by\` int(11) DEFAULT NULL,
  \`ceo_decided_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`requested_by\` int(11) NOT NULL,
  \`requested_by_name\` varchar(100) DEFAULT NULL,
  \`rejection_reason\` text,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`request_type\` varchar(20) DEFAULT 'EXISTING_DRUG',
  \`drug_category\` varchar(100) DEFAULT NULL,
  \`drug_classification\` varchar(100) DEFAULT NULL,
  \`therapeutic_use\` text,
  \`request_reason\` text,
  \`wait_document\` varchar(255) DEFAULT NULL,
  \`wait_instructions\` text,
  \`new_drug_flag\` varchar(10) DEFAULT 'NO',
  \`manager_signature\` text,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`procurement_requests_pr_no_unique\` (\`pr_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_requests');
};
