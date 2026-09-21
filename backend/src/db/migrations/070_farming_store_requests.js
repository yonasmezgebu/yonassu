// Migration step 70 of 362
// Creates table: farming_store_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`farming_store_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_number\` varchar(50) NOT NULL,
  \`requested_by\` int(11) NOT NULL,
  \`store_handler\` int(11) DEFAULT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`status\` enum('PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED') DEFAULT 'FORWARDED_TO_CEO',
  \`rejection_reason\` text,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`request_number\` (\`request_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('farming_store_requests');
};
