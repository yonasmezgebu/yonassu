// Migration step 89 of 362
// Creates table: general_procurement_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`general_procurement_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(255) DEFAULT NULL,
  \`module\` varchar(255) NOT NULL,
  \`item_name\` varchar(255) NOT NULL,
  \`item_description\` text,
  \`quantity\` int(11) NOT NULL,
  \`estimated_cost\` decimal(15,2) DEFAULT NULL,
  \`urgency\` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  \`justification\` text,
  \`requester_signature\` longtext,
  \`requested_by\` int(10) unsigned DEFAULT NULL,
  \`status\` varchar(255) DEFAULT 'PENDING',
  \`ceo_decision_reason\` text,
  \`ceo_document_url\` varchar(255) DEFAULT NULL,
  \`decided_by\` int(10) unsigned DEFAULT NULL,
  \`decided_at\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`accepted_by\` int(10) unsigned DEFAULT NULL,
  \`accepted_at\` timestamp NULL DEFAULT NULL,
  \`payment_requested_at\` timestamp NULL DEFAULT NULL,
  \`finance_note\` text,
  \`finance_checked_at\` timestamp NULL DEFAULT NULL,
  \`finance_checked_by\` int(10) unsigned DEFAULT NULL,
  \`payment_decided_at\` timestamp NULL DEFAULT NULL,
  \`payment_decided_by\` int(10) unsigned DEFAULT NULL,
  \`requested_amount\` decimal(14,2) DEFAULT NULL,
  \`paid_at\` timestamp NULL DEFAULT NULL,
  \`paid_by\` int(11) DEFAULT NULL,
  \`paid_amount\` decimal(14,2) DEFAULT NULL,
  \`tender_reference\` varchar(255) DEFAULT NULL,
  \`completed_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`general_procurement_requests_request_code_unique\` (\`request_code\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('general_procurement_requests');
};
