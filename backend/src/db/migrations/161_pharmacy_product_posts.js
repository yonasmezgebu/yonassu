// Migration step 161 of 362
// Creates table: pharmacy_product_posts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_product_posts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`description\` text,
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`image_url\` varchar(500) DEFAULT NULL,
  \`posted_by\` int(10) unsigned DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_product_posts');
};
