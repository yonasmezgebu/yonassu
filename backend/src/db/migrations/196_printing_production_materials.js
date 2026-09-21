// Migration step 196 of 362
// Creates table: printing_production_materials
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_production_materials\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`material_id\` varchar(30) NOT NULL COMMENT 'Reference to printing_store_materials.material_id',
  \`quantity_moved\` decimal(15,3) DEFAULT '0.000',
  \`quantity_consumed\` decimal(15,3) DEFAULT '0.000',
  \`quantity_remaining\` decimal(15,3) DEFAULT '0.000',
  \`moved_date\` date DEFAULT NULL,
  \`approved_by\` varchar(150) DEFAULT NULL,
  \`job_reference\` varchar(100) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_production_materials');
};
