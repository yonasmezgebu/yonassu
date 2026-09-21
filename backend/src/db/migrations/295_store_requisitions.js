// Migration step 295 of 362
// Creates table: store_requisitions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_requisitions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`requisition_no\` varchar(50) NOT NULL,
  \`department\` varchar(255) DEFAULT NULL,
  \`requested_by\` varchar(150) DEFAULT NULL,
  \`priority\` varchar(50) DEFAULT 'Normal',
  \`status\` enum('Pending','Approved','Issued','Rejected') DEFAULT 'Pending',
  \`requisition_date\` date DEFAULT NULL,
  \`remarks\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_requisitions_requisition_no_unique\` (\`requisition_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_requisitions');
};
