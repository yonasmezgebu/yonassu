// Migration step 290 of 362
// Creates table: stock_transfer_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_transfer_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`transfer_id\` int(10) unsigned NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`stock_transfer_items_transfer_id_foreign\` (\`transfer_id\`),
  KEY \`stock_transfer_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`stock_transfer_items_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`),
  CONSTRAINT \`stock_transfer_items_transfer_id_foreign\` FOREIGN KEY (\`transfer_id\`) REFERENCES \`stock_transfers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_transfer_items');
};
