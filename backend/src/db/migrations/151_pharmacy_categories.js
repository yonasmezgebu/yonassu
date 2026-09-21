// Migration step 151 of 362
// Creates table: pharmacy_categories
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`slug\` varchar(100) NOT NULL,
  \`description\` text,
  \`cover_image\` varchar(255) DEFAULT NULL,
  \`icon_class\` varchar(50) DEFAULT NULL,
  \`display_order\` int(11) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`slug\` (\`slug\`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_categories');
};
