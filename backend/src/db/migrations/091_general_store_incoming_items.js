// Migration step 91 of 362
// Creates table: general_store_incoming_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`general_store_incoming_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`incoming_id\` int(10) unsigned NOT NULL,
  \`item_description\` varchar(200) DEFAULT NULL,
  \`quantity\` decimal(15,3) DEFAULT '0.000',
  \`unit\` varchar(50) DEFAULT 'unit',
  \`unit_price\` decimal(15,2) DEFAULT '0.00',
  \`line_total\` decimal(15,2) DEFAULT '0.00',
  \`status\` varchar(20) DEFAULT 'pending',
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`received_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`general_store_incoming_items_incoming_id_foreign\` (\`incoming_id\`),
  CONSTRAINT \`general_store_incoming_items_incoming_id_foreign\` FOREIGN KEY (\`incoming_id\`) REFERENCES \`general_store_incoming\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('general_store_incoming_items');
};
