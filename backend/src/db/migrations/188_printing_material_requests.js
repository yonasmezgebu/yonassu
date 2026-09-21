// Migration step 188 of 362
// Creates table: printing_material_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_material_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(50) NOT NULL,
  \`material_id\` varchar(50) NOT NULL,
  \`material_name\` varchar(200) DEFAULT NULL,
  \`quantity_requested\` decimal(10,2) NOT NULL,
  \`quantity_shipped\` decimal(10,2) DEFAULT NULL,
  \`quantity_received\` decimal(10,2) DEFAULT NULL,
  \`store_qty_at_request\` decimal(10,2) DEFAULT NULL,
  \`urgency\` varchar(20) DEFAULT 'MEDIUM',
  \`status\` varchar(30) DEFAULT 'PENDING',
  \`notes\` text,
  \`rejection_reason\` text,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_by_name\` varchar(200) DEFAULT NULL,
  \`decided_by\` int(10) unsigned DEFAULT NULL,
  \`shipped_by\` int(10) unsigned DEFAULT NULL,
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`decided_at\` timestamp NULL DEFAULT NULL,
  \`shipped_at\` timestamp NULL DEFAULT NULL,
  \`received_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_material_requests');
};
