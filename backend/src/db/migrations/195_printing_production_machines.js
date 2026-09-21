// Migration step 195 of 362
// Creates table: printing_production_machines
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_production_machines\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`machine_id\` varchar(30) NOT NULL COMMENT 'Reference to printing_store_machines.machine_id',
  \`status\` enum('Active/Functional','Idle in Production','Returned to Store') DEFAULT 'Active/Functional',
  \`moved_date\` date DEFAULT NULL,
  \`approved_by\` varchar(150) DEFAULT NULL COMMENT 'Printing Supervisor who approved the move',
  \`job_reference\` varchar(100) DEFAULT NULL COMMENT 'Optional print job/order reference',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_production_machines');
};
