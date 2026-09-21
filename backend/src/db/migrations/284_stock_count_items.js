// Migration step 284 of 362
// Creates table: stock_count_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_count_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`count_id\` int(10) unsigned NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`system_quantity\` int(11) DEFAULT NULL,
  \`physical_quantity\` int(11) DEFAULT NULL,
  \`variance\` int(11) DEFAULT NULL,
  \`reason_code\` varchar(100) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`stock_count_items_count_id_foreign\` (\`count_id\`),
  KEY \`stock_count_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`stock_count_items_count_id_foreign\` FOREIGN KEY (\`count_id\`) REFERENCES \`stock_counts\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`stock_count_items_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_count_items');
};
