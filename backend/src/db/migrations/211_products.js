// Migration step 211 of 362
// Creates table: products
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(200) NOT NULL,
  \`sku\` varchar(50) NOT NULL,
  \`category_id\` int(11) NOT NULL,
  \`unit_id\` int(11) NOT NULL,
  \`selling_price\` decimal(15,2) NOT NULL,
  \`reorder_level\` int(11) DEFAULT '0',
  \`expiry_date\` date DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`deleted_at\` datetime DEFAULT NULL,
  \`business_unit\` enum('retail','farming','pharmacy','rental') DEFAULT NULL,
  \`description\` text,
  \`product_image\` varchar(255) DEFAULT NULL,
  \`cost_price\` decimal(10,2) DEFAULT '0.00',
  \`stock_quantity\` int(11) DEFAULT '0',
  \`requires_serial\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`sku\` (\`sku\`),
  KEY \`idx_products_sku\` (\`sku\`),
  KEY \`idx_products_category\` (\`category_id\`),
  KEY \`idx_products_expiry\` (\`expiry_date\`),
  KEY \`unit_id\` (\`unit_id\`),
  KEY \`supplier_id\` (\`supplier_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('products');
};
