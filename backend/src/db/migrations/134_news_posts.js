// Migration step 134 of 362
// Creates table: news_posts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`news_posts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`type\` varchar(255) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`content\` text,
  \`visibility\` varchar(255) NOT NULL DEFAULT 'public',
  \`youtube_url\` varchar(255) DEFAULT NULL,
  \`images\` json DEFAULT NULL,
  \`hiring_position\` varchar(255) DEFAULT NULL,
  \`hiring_deadline\` date DEFAULT NULL,
  \`hiring_email\` varchar(255) DEFAULT NULL,
  \`hiring_location\` varchar(255) DEFAULT NULL,
  \`status\` varchar(255) NOT NULL DEFAULT 'draft',
  \`posted_by\` int(10) unsigned DEFAULT NULL,
  \`send_notification\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('news_posts');
};
