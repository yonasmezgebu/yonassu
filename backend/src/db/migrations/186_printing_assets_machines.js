// Migration step 186 of 362
// Creates table: printing_assets_machines
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_assets_machines\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`machine_id\` varchar(30) NOT NULL COMMENT 'e.g. PSM-001',
  \`machine_name\` varchar(150) NOT NULL,
  \`model_serial\` varchar(150) DEFAULT NULL,
  \`status\` enum('In Store','Moved to Production','Under Maintenance') DEFAULT 'In Store',
  \`registered_by\` varchar(150) DEFAULT NULL COMMENT 'General Store Keeper name',
  \`date_registered\` date DEFAULT NULL,
  \`internal_value\` decimal(15,2) DEFAULT '0.00' COMMENT 'Set by Finance only',
  \`condition_notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`department\` varchar(255) DEFAULT 'Printing',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`printing_store_machines_machine_id_unique\` (\`machine_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_assets_machines');
};
