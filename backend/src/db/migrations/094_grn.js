// Migration step 94 of 362
// Creates table: grn
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`grn\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`grn_no\` varchar(30) NOT NULL,
  \`issue_voucher_id\` int(11) NOT NULL,
  \`iss_no\` varchar(30) NOT NULL,
  \`approval_id\` int(11) NOT NULL,
  \`apr_no\` varchar(30) NOT NULL,
  \`requisition_id\` int(11) NOT NULL,
  \`req_no\` varchar(30) NOT NULL,
  \`drug_id\` int(11) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`unit_of_measure\` varchar(50) DEFAULT 'Tablets',
  \`quantity_expected\` int(11) NOT NULL,
  \`quantity_received\` int(11) NOT NULL,
  \`discrepancy_note\` text,
  \`condition\` enum('Good','Damaged') DEFAULT 'Good',
  \`pharmacy_stock_before\` int(11) NOT NULL,
  \`pharmacy_stock_after\` int(11) NOT NULL,
  \`status\` enum('PENDING','COMPLETED') DEFAULT 'PENDING',
  \`received_by\` int(11) DEFAULT NULL,
  \`received_by_name\` varchar(100) DEFAULT NULL,
  \`stamp_id\` varchar(100) DEFAULT NULL,
  \`received_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('grn');
};
