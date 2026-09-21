// Migration step 193 of 362
// Creates table: printing_posts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_posts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL,
  \`name\` varchar(150) NOT NULL,
  \`description\` text,
  \`image_url\` varchar(500) DEFAULT NULL,
  \`badge_label\` varchar(100) DEFAULT NULL,
  \`base_price_per_page\` decimal(10,2) DEFAULT '0.50',
  \`is_visible\` tinyint(1) DEFAULT '1',
  \`sort_order\` int(11) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`printing_posts_code_unique\` (\`code\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_posts');
};
