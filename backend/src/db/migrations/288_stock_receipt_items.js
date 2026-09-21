// Migration step 288 of 362
// Creates table: stock_receipt_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_receipt_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`receipt_id\` int(10) unsigned NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`manufacture_date\` date DEFAULT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`unit_cost\` decimal(12,2) DEFAULT NULL,
  \`subtotal\` decimal(12,2) DEFAULT NULL,
  \`storage_location\` varchar(100) DEFAULT NULL,
  \`near_expiry_days\` int(11) DEFAULT '90',
  PRIMARY KEY (\`id\`),
  KEY \`stock_receipt_items_receipt_id_foreign\` (\`receipt_id\`),
  KEY \`stock_receipt_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`stock_receipt_items_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`),
  CONSTRAINT \`stock_receipt_items_receipt_id_foreign\` FOREIGN KEY (\`receipt_id\`) REFERENCES \`stock_receipts\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_receipt_items');
};
