// Migration step 292 of 362
// Creates table: store_deliveries
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_deliveries\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`delivery_no\` varchar(50) NOT NULL,
  \`supplier_name\` varchar(255) DEFAULT NULL,
  \`items_description\` text,
  \`quantity_summary\` varchar(100) DEFAULT NULL,
  \`delivery_date\` date DEFAULT NULL,
  \`po_reference\` varchar(100) DEFAULT NULL,
  \`status\` enum('Pending','In Transit','Received','Rejected') DEFAULT 'Pending',
  \`rejection_reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_deliveries_delivery_no_unique\` (\`delivery_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_deliveries');
};
