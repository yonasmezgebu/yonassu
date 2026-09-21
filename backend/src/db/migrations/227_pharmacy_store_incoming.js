// Migration step 227 of 362
// Creates table: pharmacy_store_incoming
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_store_incoming\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`quotation_id\` int(11) DEFAULT NULL,
  \`purchase_order_id\` int(10) unsigned DEFAULT NULL,
  \`quotation_no\` varchar(50) DEFAULT NULL,
  \`delivery_note_no\` varchar(50) DEFAULT NULL,
  \`supplier_name\` varchar(255) DEFAULT NULL,
  \`status\` varchar(30) NOT NULL DEFAULT 'pending',
  \`total_amount\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`vat_rate\` decimal(5,2) DEFAULT '0.00',
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`received_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_store_incoming_quotation_id_foreign\` (\`quotation_id\`),
  CONSTRAINT \`pharmacy_store_incoming_quotation_id_foreign\` FOREIGN KEY (\`quotation_id\`) REFERENCES \`purchase_quotations\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_store_incoming');
};
