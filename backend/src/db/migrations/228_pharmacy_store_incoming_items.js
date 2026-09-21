// Migration step 228 of 362
// Creates table: pharmacy_store_incoming_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_store_incoming_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`incoming_id\` int(10) unsigned DEFAULT NULL,
  \`item_description\` varchar(255) NOT NULL,
  \`category\` varchar(100) DEFAULT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`strength\` varchar(50) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`quantity\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`unit\` varchar(30) DEFAULT 'unit',
  \`unit_price\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`line_total\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`status\` varchar(30) NOT NULL DEFAULT 'pending',
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`received_at\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`vat_rate\` decimal(5,2) DEFAULT '15.00',
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_store_incoming_items_incoming_id_foreign\` (\`incoming_id\`),
  CONSTRAINT \`pharmacy_store_incoming_items_incoming_id_foreign\` FOREIGN KEY (\`incoming_id\`) REFERENCES \`pharmacy_store_incoming\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_store_incoming_items');
};
