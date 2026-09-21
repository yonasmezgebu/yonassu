// Migration step 180 of 362
// Creates table: pos_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pos_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`sale_id\` int(11) NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`unit_price\` decimal(15,2) NOT NULL,
  \`discount_percent\` decimal(5,2) DEFAULT '0.00',
  \`subtotal\` decimal(15,2) NOT NULL,
  \`total\` decimal(15,2) NOT NULL,
  \`source\` varchar(50) DEFAULT 'retail',
  PRIMARY KEY (\`id\`),
  KEY \`idx_pos_items_sale\` (\`sale_id\`),
  KEY \`idx_pos_items_product\` (\`product_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_items');
};
