// Migration step 32 of 362
// Creates table: compliance_status
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`compliance_status\` (
  \`id\` int(10) unsigned NOT NULL,
  \`requirement\` varchar(200) NOT NULL,
  \`regulation\` varchar(100) DEFAULT NULL,
  \`status\` enum('compliant','non-compliant','in-progress','not-applicable') DEFAULT 'in-progress',
  \`last_review_date\` date DEFAULT NULL,
  \`next_review_date\` date DEFAULT NULL,
  \`responsible_owner\` varchar(100) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('compliance_status');
};
