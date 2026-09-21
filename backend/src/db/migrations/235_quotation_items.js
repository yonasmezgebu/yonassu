// Migration step 235 of 362
// Creates table: quotation_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`quotation_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`quotation_id\` int(10) unsigned NOT NULL,
  \`product_id\` int(11) DEFAULT NULL,
  \`product_name\` varchar(200) NOT NULL,
  \`quantity\` decimal(15,2) NOT NULL,
  \`unit_price\` decimal(15,2) NOT NULL,
  \`discount_percent\` decimal(5,2) DEFAULT '0.00',
  \`line_total\` decimal(15,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`quotation_items_quotation_id_foreign\` (\`quotation_id\`),
  CONSTRAINT \`quotation_items_quotation_id_foreign\` FOREIGN KEY (\`quotation_id\`) REFERENCES \`quotations\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('quotation_items');
};
