// Migration step 42 of 362
// Creates table: danger_zone_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`danger_zone_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`action\` varchar(50) NOT NULL DEFAULT 'RESET_ALL_DATA',
  \`requested_by\` int(11) NOT NULL,
  \`requested_by_name\` varchar(255) DEFAULT NULL,
  \`reason\` text NOT NULL,
  \`confirm_text\` varchar(50) NOT NULL,
  \`status\` varchar(20) NOT NULL DEFAULT 'PENDING',
  \`approved_by\` int(11) DEFAULT NULL,
  \`approved_by_name\` varchar(255) DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`executed_at\` timestamp NULL DEFAULT NULL,
  \`completion_summary\` json DEFAULT NULL,
  \`rejected_reason\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`danger_zone_requests_status_index\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('danger_zone_requests');
};
