// Migration step 278 of 362
// Creates table: social_links
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`social_links\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`platform\` varchar(255) NOT NULL,
  \`url\` varchar(255) DEFAULT NULL,
  \`icon_color\` varchar(255) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`social_links_platform_unique\` (\`platform\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('social_links');
};
