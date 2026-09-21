// Migration step 208 of 362
// Creates table: product_categories
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`product_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`business_unit\` enum('retail','farming','pharmacy','all','rental') DEFAULT NULL,
  \`slug\` varchar(255) DEFAULT NULL,
  \`description\` text,
  \`icon_class\` varchar(255) DEFAULT NULL,
  \`cover_image\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_categories');
};
