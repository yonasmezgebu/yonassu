// Migration step 320 of 362
// Creates table: transfer_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`transfer_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(255) NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`requested_qty\` int(11) NOT NULL,
  \`pharmacy_qty_at_request\` int(11) NOT NULL,
  \`store_qty_at_request\` int(11) NOT NULL,
  \`urgency\` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  \`status\` enum('PENDING_APPROVAL','APPROVED','REJECTED','SHIPPED','COMPLETED','CANCELLED','Requested','In Transit','Received','Closed') NOT NULL DEFAULT 'Requested',
  \`created_by\` int(10) unsigned NOT NULL,
  \`decided_by\` int(10) unsigned DEFAULT NULL,
  \`decision_reason\` text,
  \`shipped_by\` int(10) unsigned DEFAULT NULL,
  \`shipped_qty\` int(11) DEFAULT NULL,
  \`shipped_at\` datetime DEFAULT NULL,
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`received_qty\` int(11) DEFAULT NULL,
  \`received_at\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`transfer_no\` varchar(50) DEFAULT NULL,
  \`from_branch_id\` int(11) DEFAULT NULL,
  \`from_warehouse_id\` int(11) DEFAULT NULL,
  \`to_branch_id\` int(11) DEFAULT NULL,
  \`requested_by\` int(11) DEFAULT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`ceo_approved_by\` int(11) DEFAULT NULL,
  \`requested_date\` date DEFAULT NULL,
  \`decision_date\` date DEFAULT NULL,
  \`received_date\` date DEFAULT NULL,
  \`reason\` text,
  \`signature\` longtext,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`transfer_requests_request_code_unique\` (\`request_code\`),
  KEY \`transfer_requests_drug_id_foreign\` (\`drug_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transfer_requests');
};
