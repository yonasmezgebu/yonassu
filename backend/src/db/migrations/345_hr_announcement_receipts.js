// Migration step 345 of 362
// Creates table: hr_announcement_receipts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_announcement_receipts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`announcement_id\` int(10) unsigned DEFAULT NULL,
  \`user_id\` int(11) DEFAULT NULL,
  \`viewed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`hr_announcement_receipts_announcement_id_foreign\` (\`announcement_id\`),
  KEY \`hr_announcement_receipts_user_id_foreign\` (\`user_id\`),
  CONSTRAINT \`hr_announcement_receipts_announcement_id_foreign\` FOREIGN KEY (\`announcement_id\`) REFERENCES \`hr_announcements\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`hr_announcement_receipts_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_announcement_receipts');
};
