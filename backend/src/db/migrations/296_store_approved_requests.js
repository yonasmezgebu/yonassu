// Migration step 296 of 362
// Creates table: store_approved_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_approved_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`approval_no\` varchar(50) NOT NULL,
  \`requisition_id\` int(10) unsigned DEFAULT NULL,
  \`department\` varchar(255) DEFAULT NULL,
  \`approved_by\` varchar(150) DEFAULT NULL,
  \`approval_date\` date DEFAULT NULL,
  \`stamp_id\` varchar(50) DEFAULT NULL,
  \`status\` enum('Active','Fulfilled','Cancelled') DEFAULT 'Active',
  \`remarks\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_approved_requests_approval_no_unique\` (\`approval_no\`),
  KEY \`store_approved_requests_requisition_id_foreign\` (\`requisition_id\`),
  CONSTRAINT \`store_approved_requests_requisition_id_foreign\` FOREIGN KEY (\`requisition_id\`) REFERENCES \`store_requisitions\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_approved_requests');
};
