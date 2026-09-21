// Migration step 248 of 362
// Creates table: retail_products
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_products\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`category_id\` int(10) unsigned DEFAULT NULL,
  \`sku\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`description\` text,
  \`price\` decimal(10,2) NOT NULL,
  \`cost_price\` decimal(10,2) DEFAULT '0.00',
  \`stock_quantity\` int(11) DEFAULT '0',
  \`reorder_level\` int(11) DEFAULT '10',
  \`expiry_date\` date DEFAULT NULL,
  \`product_image\` varchar(255) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`retail_products_sku_unique\` (\`sku\`),
  KEY \`retail_products_category_id_foreign\` (\`category_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_products');
};
