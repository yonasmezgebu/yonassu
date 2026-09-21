// Migration step 136 of 362
// Creates table: notifications
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`notifications\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`role_target\` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`title\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`message\` mediumtext COLLATE utf8mb4_unicode_ci,
  \`news_post_id\` int(10) unsigned DEFAULT NULL,
  \`is_read\` tinyint(1) DEFAULT '0',
  \`read_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`type\` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  \`link\` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  \`related_entity_id\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=641 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};
