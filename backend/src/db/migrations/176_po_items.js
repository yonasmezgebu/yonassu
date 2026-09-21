// Migration step 176 of 362
// Creates table: po_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`po_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`po_id\` int(11) NOT NULL,
  \`product_id\` int(11) DEFAULT NULL,
  \`product_name\` varchar(200) NOT NULL,
  \`quantity_ordered\` int(11) NOT NULL,
  \`unit_price\` decimal(15,2) NOT NULL,
  \`total\` decimal(15,2) NOT NULL,
  \`quantity_received\` int(11) DEFAULT '0',
  \`quantity_damaged\` int(11) DEFAULT '0',
  \`quality_pass\` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_po_items_po\` (\`po_id\`),
  KEY \`idx_po_items_product\` (\`product_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('po_items');
};
