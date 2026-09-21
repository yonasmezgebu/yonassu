// Migration step 8 of 362
// Creates table: approvals
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`approvals\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`apr_no\` varchar(30) NOT NULL,
  \`requisition_id\` int(11) NOT NULL,
  \`req_no\` varchar(30) NOT NULL,
  \`drug_id\` int(11) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`quantity_approved\` int(11) NOT NULL,
  \`decision\` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  \`rejection_reason\` text,
  \`approved_by\` int(11) DEFAULT NULL,
  \`approved_by_name\` varchar(100) DEFAULT NULL,
  \`stamp_id\` varchar(100) DEFAULT NULL,
  \`approved_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`approvals_apr_no_unique\` (\`apr_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('approvals');
};
