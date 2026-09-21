// Migration step 48 of 362
// Creates table: drugs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`drugs\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`strength\` varchar(255) DEFAULT NULL,
  \`unit\` varchar(255) DEFAULT NULL,
  \`unit_price\` decimal(10,2) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`category\` varchar(255) DEFAULT NULL,
  \`classification\` varchar(255) DEFAULT NULL,
  \`therapeutic_use\` text,
  \`status\` enum('PENDING','ACTIVE','REJECTED') DEFAULT 'ACTIVE',
  \`requires_prescription\` tinyint(1) DEFAULT '0',
  \`vat_rate\` decimal(5,2) DEFAULT '15.00',
  \`drug_image\` varchar(500) DEFAULT NULL,
  \`drug_code\` varchar(50) DEFAULT NULL,
  \`generic_name\` varchar(150) DEFAULT NULL,
  \`brand_name\` varchar(150) DEFAULT NULL,
  \`dosage_form\` varchar(50) DEFAULT NULL,
  \`barcode\` varchar(100) DEFAULT NULL,
  \`manufacturer_id\` int(11) DEFAULT NULL,
  \`category_id\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('drugs');
};
