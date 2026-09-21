// Migration step 92 of 362
// Creates table: general_store_materials
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`general_store_materials\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`material_id\` varchar(30) NOT NULL COMMENT 'e.g. PSMAT-001',
  \`material_name\` varchar(150) NOT NULL,
  \`category\` varchar(100) DEFAULT 'Other',
  \`unit\` varchar(50) DEFAULT 'unit' COMMENT 'Roll, box, liter, kg, ream, etc.',
  \`quantity_in_store\` decimal(15,3) DEFAULT '0.000',
  \`unit_value\` decimal(15,2) DEFAULT '0.00' COMMENT 'Cost per unit, set by Finance',
  \`total_value\` decimal(15,2) DEFAULT '0.00' COMMENT 'quantity_in_store x unit_value',
  \`registered_by\` varchar(150) DEFAULT NULL,
  \`date_registered\` date DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`department\` varchar(255) DEFAULT 'General',
  \`reorder_level\` int(11) DEFAULT '10',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`printing_store_materials_material_id_unique\` (\`material_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('general_store_materials');
};
