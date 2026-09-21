// Migration step 270 of 362
// Creates table: self_registered_suppliers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`self_registered_suppliers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`full_name\` varchar(200) NOT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`company_name\` varchar(200) DEFAULT NULL,
  \`category\` varchar(200) NOT NULL,
  \`business_address\` text,
  \`description\` text,
  \`status\` varchar(50) NOT NULL DEFAULT 'Active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`profile_photo\` varchar(255) DEFAULT NULL,
  \`tax_id\` varchar(100) DEFAULT NULL,
  \`payment_terms\` varchar(50) DEFAULT NULL,
  \`credit_limit\` decimal(15,2) DEFAULT NULL,
  \`location_type\` varchar(50) DEFAULT NULL,
  \`bank_name\` varchar(200) DEFAULT NULL,
  \`bank_account_number\` varchar(50) DEFAULT NULL,
  \`bank_account_holder\` varchar(200) DEFAULT NULL,
  \`website\` varchar(255) DEFAULT NULL,
  \`bank_account\` varchar(255) DEFAULT NULL,
  \`bank_holder\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`self_registered_suppliers_user_id_unique\` (\`user_id\`),
  KEY \`self_registered_suppliers_status_index\` (\`status\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('self_registered_suppliers');
};
