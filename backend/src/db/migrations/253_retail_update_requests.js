// Migration step 253 of 362
// Creates table: retail_update_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_update_requests\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`requested_by\` int(11) DEFAULT NULL,
  \`old_data\` json NOT NULL,
  \`new_data\` json NOT NULL,
  \`status\` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  \`rejection_reason\` varchar(500) DEFAULT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_update_requests');
};
