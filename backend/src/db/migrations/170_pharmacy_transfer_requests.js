// Migration step 170 of 362
// Creates table: pharmacy_transfer_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_transfer_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_number\` varchar(30) NOT NULL,
  \`drug_id\` int(11) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`urgency\` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  \`status\` enum('PENDING','APPROVED','REJECTED','SHIPPED','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  \`store_qty_before\` int(11) DEFAULT NULL,
  \`pharmacy_qty_before\` int(11) DEFAULT NULL,
  \`pharmacy_reorder_level\` int(11) DEFAULT NULL,
  \`store_unit_price\` decimal(15,2) DEFAULT NULL,
  \`pharmacy_unit_price\` decimal(15,2) DEFAULT NULL,
  \`rejection_reason\` text,
  \`notes\` text,
  \`created_by\` int(11) NOT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`rejected_by\` int(11) DEFAULT NULL,
  \`shipped_by\` int(11) DEFAULT NULL,
  \`received_by\` int(11) DEFAULT NULL,
  \`shipment_number\` varchar(30) DEFAULT NULL,
  \`quantity_shipped\` int(11) DEFAULT NULL,
  \`shipped_at\` datetime DEFAULT NULL,
  \`received_at\` datetime DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pharmacy_transfer_requests_request_number_unique\` (\`request_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_transfer_requests');
};
