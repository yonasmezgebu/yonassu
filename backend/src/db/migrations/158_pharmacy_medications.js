// Migration step 158 of 362
// Creates table: pharmacy_medications
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_medications\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(200) NOT NULL,
  \`generic_name\` varchar(200) DEFAULT NULL,
  \`category_id\` int(11) NOT NULL,
  \`branch_id\` int(11) DEFAULT NULL,
  \`manufacturer\` varchar(200) DEFAULT NULL,
  \`price\` decimal(10,2) NOT NULL,
  \`price_unit\` varchar(50) DEFAULT NULL,
  \`stock_quantity\` int(11) DEFAULT '0',
  \`reorder_level\` int(11) DEFAULT '10',
  \`drug_image\` varchar(255) DEFAULT NULL,
  \`cover_image\` varchar(255) DEFAULT NULL,
  \`description\` text,
  \`dosage_info\` text,
  \`expiry_date\` date DEFAULT NULL,
  \`is_prescription_required\` tinyint(1) DEFAULT '1',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`is_hidden\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`selling_price\` decimal(12,2) DEFAULT NULL,
  \`batch_no\` varchar(255) DEFAULT NULL,
  \`strength\` varchar(255) DEFAULT NULL,
  \`unit\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`category_id\` (\`category_id\`),
  CONSTRAINT \`pharmacy_medications_ibfk_1\` FOREIGN KEY (\`category_id\`) REFERENCES \`pharmacy_categories\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_medications');
};
