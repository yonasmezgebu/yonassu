// Migration step 249 of 362
// Creates table: retail_order_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_order_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`order_id\` int(10) unsigned DEFAULT NULL,
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`quantity\` int(11) NOT NULL,
  \`unit_price\` decimal(10,2) NOT NULL,
  \`subtotal\` decimal(12,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`retail_order_items_order_id_foreign\` (\`order_id\`),
  KEY \`retail_order_items_product_id_foreign\` (\`product_id\`),
  CONSTRAINT \`retail_order_items_order_id_foreign\` FOREIGN KEY (\`order_id\`) REFERENCES \`retail_orders\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`retail_order_items_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`retail_products\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_order_items');
};
