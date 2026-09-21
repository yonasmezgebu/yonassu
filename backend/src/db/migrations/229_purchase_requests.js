// Migration step 229 of 362
// Creates table: purchase_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`purchase_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(255) NOT NULL,
  \`drug_id\` int(10) unsigned DEFAULT NULL,
  \`scenario\` enum('STORE_AND_PHARMACY_LOW','STORE_ONLY_LOW','NEW_DRUG') DEFAULT NULL,
  \`store_qty_at_request\` int(11) DEFAULT NULL,
  \`store_min_level\` int(11) DEFAULT NULL,
  \`pharmacy_qty_at_request\` int(11) DEFAULT NULL,
  \`pharmacy_reorder_level\` int(11) DEFAULT NULL,
  \`requested_qty\` int(11) NOT NULL,
  \`urgency\` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  \`status\` enum('PENDING_DECISION','APPROVED','REJECTED','WAIT') DEFAULT 'PENDING_DECISION',
  \`created_by\` int(10) unsigned NOT NULL,
  \`decided_by\` int(10) unsigned DEFAULT NULL,
  \`decision\` enum('APPROVE','REJECT','WAIT') DEFAULT NULL,
  \`decision_reason\` text,
  \`wait_document_url\` varchar(255) DEFAULT NULL,
  \`wait_instructions\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`is_new_drug\` tinyint(1) DEFAULT '0',
  \`new_drug_category\` varchar(255) DEFAULT NULL,
  \`new_drug_classification\` varchar(255) DEFAULT NULL,
  \`new_drug_therapeutic_use\` text,
  \`purpose_reason\` text,
  \`new_drug_name\` varchar(255) DEFAULT NULL,
  \`new_drug_strength\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`purchase_requests_request_code_unique\` (\`request_code\`),
  KEY \`purchase_requests_drug_id_foreign\` (\`drug_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_requests');
};
