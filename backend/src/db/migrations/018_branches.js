// Migration step 18 of 362
// Creates table: branches
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`branches\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`code\` varchar(10) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`status\` enum('Active','Inactive') DEFAULT 'Active',
  \`address\` text,
  \`phone\` varchar(50) DEFAULT NULL,
  \`working_hours\` varchar(100) DEFAULT NULL,
  \`manager_name\` varchar(100) DEFAULT NULL,
  \`alternate_phone\` varchar(50) DEFAULT NULL,
  \`working_hours_monday_saturday\` varchar(100) DEFAULT NULL,
  \`working_hours_sunday\` varchar(100) DEFAULT NULL,
  \`emergency_phone\` varchar(50) DEFAULT NULL,
  \`delivery_support_phone\` varchar(50) DEFAULT NULL,
  \`latitude\` decimal(10,2) DEFAULT NULL,
  \`longitude\` decimal(10,2) DEFAULT NULL,
  \`display_order\` int(11) DEFAULT NULL,
  \`cover_image\` varchar(500) DEFAULT NULL,
  \`branch_name\` varchar(100) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`branches_name_unique\` (\`name\`),
  UNIQUE KEY \`branches_code_unique\` (\`code\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('branches');
};
