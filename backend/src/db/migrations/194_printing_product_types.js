// Migration step 194 of 362
// Creates table: printing_product_types
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_product_types\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`code\` varchar(50) NOT NULL,
  \`base_price_per_page\` decimal(10,2) DEFAULT '0.50',
  \`color_multiplier\` decimal(5,2) DEFAULT '2.00',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`sort_order\` int(11) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`printing_product_types_code_unique\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_product_types');
};
