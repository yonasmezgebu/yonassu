// Migration step 240 of 362
// Creates table: requisitions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`requisitions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`req_no\` varchar(30) NOT NULL,
  \`drug_id\` int(11) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`unit_of_measure\` varchar(50) DEFAULT 'Tablets',
  \`quantity_requested\` int(11) NOT NULL,
  \`current_stock\` int(11) NOT NULL COMMENT 'Pharmacy stock at time of request',
  \`reorder_level\` int(11) NOT NULL,
  \`justification\` text,
  \`status\` enum('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  \`requesting_dept\` varchar(100) DEFAULT 'Pharmacy',
  \`requested_by\` int(11) NOT NULL,
  \`requested_by_name\` varchar(100) DEFAULT NULL,
  \`rejection_reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('requisitions');
};
