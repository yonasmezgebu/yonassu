// Migration step 213 of 362
// Creates table: price_list_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`price_list_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`price_list_id\` int(10) unsigned NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`unit_price\` decimal(15,2) NOT NULL,
  \`min_quantity\` int(11) DEFAULT '1',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`price_list_items_price_list_id_product_id_min_quantity_unique\` (\`price_list_id\`,\`product_id\`,\`min_quantity\`),
  KEY \`price_list_items_product_id_foreign\` (\`product_id\`),
  CONSTRAINT \`price_list_items_price_list_id_foreign\` FOREIGN KEY (\`price_list_id\`) REFERENCES \`price_lists\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`price_list_items_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('price_list_items');
};
