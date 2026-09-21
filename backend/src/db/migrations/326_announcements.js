// Migration step 326 of 362
// Creates table: announcements
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`announcements\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(150) NOT NULL,
  \`message\` text NOT NULL,
  \`created_by\` int(11) NOT NULL,
  \`target_audience\` enum('All Branches','Specific Branch','Managers Only') NOT NULL DEFAULT 'All Branches',
  \`target_branch_id\` int(10) unsigned DEFAULT NULL,
  \`published_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`expires_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`announcements_created_by_foreign\` (\`created_by\`),
  KEY \`announcements_target_branch_id_foreign\` (\`target_branch_id\`),
  CONSTRAINT \`announcements_created_by_foreign\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`announcements_target_branch_id_foreign\` FOREIGN KEY (\`target_branch_id\`) REFERENCES \`branches\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('announcements');
};
