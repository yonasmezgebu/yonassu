// Migration step 344 of 362
// Creates table: hr_announcements
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_announcements\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`body\` text NOT NULL,
  \`author_id\` int(11) DEFAULT NULL,
  \`audience_scope\` json DEFAULT NULL,
  \`priority\` varchar(255) DEFAULT 'Info',
  \`status\` varchar(255) DEFAULT 'Published',
  \`publish_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`expires_at\` datetime DEFAULT NULL,
  \`linked_policy_id\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`hr_announcements_author_id_foreign\` (\`author_id\`),
  KEY \`hr_announcements_linked_policy_id_foreign\` (\`linked_policy_id\`),
  CONSTRAINT \`hr_announcements_author_id_foreign\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`hr_announcements_linked_policy_id_foreign\` FOREIGN KEY (\`linked_policy_id\`) REFERENCES \`hr_policies\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_announcements');
};
