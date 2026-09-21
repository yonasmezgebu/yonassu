// Migration step 175 of 362
// Creates table: pharmacy_sale_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_sale_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`sale_id\` int(10) unsigned DEFAULT NULL,
  \`drug_name\` varchar(200) DEFAULT NULL,
  \`quantity\` int(11) DEFAULT '1',
  \`unit_price\` decimal(12,2) DEFAULT '0.00',
  \`total_price\` decimal(12,2) DEFAULT '0.00',
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_sale_items_sale_id_foreign\` (\`sale_id\`),
  CONSTRAINT \`pharmacy_sale_items_sale_id_foreign\` FOREIGN KEY (\`sale_id\`) REFERENCES \`pharmacy_sales\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_sale_items');
};
