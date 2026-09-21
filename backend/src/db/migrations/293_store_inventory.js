// Migration step 293 of 362
// Creates table: store_inventory
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_inventory\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`min_level\` int(11) NOT NULL DEFAULT '0',
  \`max_level\` int(11) DEFAULT '0',
  \`warehouse_id\` int(11) DEFAULT NULL,
  \`reserved_quantity\` int(11) DEFAULT NULL,
  \`selling_price\` decimal(12,2) DEFAULT NULL,
  \`manufacture_date\` date DEFAULT NULL,
  \`notes\` text,
  \`stock_status\` enum('In Stock','Low Stock','Out of Stock','Expired') DEFAULT NULL,
  \`reorder_level\` int(11) DEFAULT '0',
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`unit_cost\` decimal(12,2) DEFAULT NULL,
  \`storage_location\` varchar(100) DEFAULT NULL,
  \`last_received_at\` timestamp NULL DEFAULT NULL,
  \`last_issued_at\` timestamp NULL DEFAULT NULL,
  \`near_expiry_days\` int(11) DEFAULT '90',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_inventory_drug_warehouse_batch_unique\` (\`drug_id\`,\`warehouse_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_inventory');
};
