// Migration step 117 of 362
// Creates table: issue_vouchers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`issue_vouchers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`iss_no\` varchar(30) NOT NULL,
  \`approval_id\` int(11) NOT NULL,
  \`apr_no\` varchar(30) NOT NULL,
  \`requisition_id\` int(11) NOT NULL,
  \`req_no\` varchar(30) NOT NULL,
  \`drug_id\` int(11) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`unit_of_measure\` varchar(50) DEFAULT 'Tablets',
  \`quantity_approved\` int(11) NOT NULL,
  \`quantity_issued\` int(11) NOT NULL,
  \`batch_number\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`store_stock_before\` int(11) NOT NULL,
  \`store_stock_after\` int(11) NOT NULL,
  \`status\` enum('DRAFT','ISSUED','RECEIVED','COMPLETED') DEFAULT 'DRAFT',
  \`issued_by\` int(11) DEFAULT NULL,
  \`issued_by_name\` varchar(100) DEFAULT NULL,
  \`stamp_id\` varchar(100) DEFAULT NULL,
  \`issued_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`issue_vouchers_iss_no_unique\` (\`iss_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('issue_vouchers');
};
