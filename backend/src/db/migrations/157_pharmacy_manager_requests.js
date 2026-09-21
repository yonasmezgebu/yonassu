// Migration step 157 of 362
// Creates table: pharmacy_manager_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_manager_requests\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`drug_name\` varchar(200) DEFAULT NULL,
  \`drug_id\` int(11) DEFAULT NULL,
  \`drug_image\` varchar(500) DEFAULT NULL,
  \`request_type\` varchar(30) DEFAULT NULL COMMENT 'QUANTITY / PRICE',
  \`current_value\` decimal(12,2) DEFAULT NULL,
  \`requested_value\` decimal(12,2) DEFAULT NULL,
  \`ceo_value\` decimal(12,2) DEFAULT NULL,
  \`status\` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  \`reason\` text,
  \`requested_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_manager_requests');
};
