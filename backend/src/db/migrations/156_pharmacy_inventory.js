// Migration step 156 of 362
// Creates table: pharmacy_inventory
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_inventory\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`reorder_level\` int(11) NOT NULL DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`branch_id\` int(11) DEFAULT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`stock_status\` enum('In Stock','Low Stock','Out of Stock','Expired') DEFAULT NULL,
  \`last_updated_at\` timestamp NULL DEFAULT NULL,
  \`strength\` varchar(50) DEFAULT NULL,
  \`unit_cost\` decimal(14,2) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pharmacy_inventory_branch_drug_batch_unique\` (\`branch_id\`,\`drug_id\`,\`batch_no\`),
  KEY \`pharmacy_inventory_drug_id_foreign\` (\`drug_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_inventory');
};
