// Migration step 304 of 362
// Creates table: store_suppliers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_suppliers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_no\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`contact_person\` varchar(150) DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`address\` text,
  \`tax_id\` varchar(100) DEFAULT NULL,
  \`payment_terms\` varchar(50) DEFAULT 'Net 30',
  \`status\` enum('Active','Inactive') DEFAULT 'Active',
  \`delivery_count\` int(11) DEFAULT '0',
  \`balance\` decimal(12,2) DEFAULT '0.00',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_suppliers_supplier_no_unique\` (\`supplier_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_suppliers');
};
