// Migration step 7 of 362
// Creates table: alerts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`alerts\` (
  \`id\` varchar(36) NOT NULL,
  \`type\` enum('CRITICAL','WARNING','INFO') NOT NULL,
  \`module\` varchar(50) NOT NULL,
  \`title\` varchar(200) NOT NULL,
  \`message\` text NOT NULL,
  \`priority\` int(11) NOT NULL DEFAULT '5',
  \`target_user_id\` int(10) unsigned DEFAULT NULL,
  \`target_role\` varchar(100) DEFAULT NULL,
  \`status\` enum('UNREAD','READ','RESOLVED') NOT NULL DEFAULT 'UNREAD',
  \`related_record_id\` varchar(100) DEFAULT NULL,
  \`related_module\` varchar(50) DEFAULT NULL,
  \`fingerprint\` varchar(200) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`alerts_fingerprint_unique\` (\`fingerprint\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('alerts');
};
