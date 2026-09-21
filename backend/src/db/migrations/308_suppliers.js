// Migration step 308 of 362
// Creates table: suppliers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`suppliers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(200) NOT NULL,
  \`contact_person\` varchar(100) NOT NULL,
  \`phone\` varchar(20) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`address\` text NOT NULL,
  \`payment_terms_id\` int(11) DEFAULT NULL,
  \`lead_time_days\` int(11) DEFAULT '7',
  \`tax_id\` varchar(50) DEFAULT NULL,
  \`bank_account\` varchar(100) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`deleted_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`),
  KEY \`idx_suppliers_name\` (\`name\`),
  KEY \`idx_suppliers_active\` (\`is_active\`),
  KEY \`payment_terms_id\` (\`payment_terms_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('suppliers');
};
