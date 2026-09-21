// Migration step 88 of 362
// Creates table: general_movement_log
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`general_movement_log\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`item_type\` enum('Machine','Material') NOT NULL,
  \`item_id\` varchar(30) NOT NULL,
  \`from_location\` varchar(100) DEFAULT 'Printing Store',
  \`to_location\` varchar(100) DEFAULT 'Printing Production',
  \`quantity\` decimal(15,3) DEFAULT '0.000' COMMENT 'For materials only',
  \`moved_by\` varchar(150) DEFAULT NULL COMMENT 'General Store Keeper who released the item',
  \`approved_by\` varchar(150) DEFAULT NULL,
  \`notes\` varchar(500) DEFAULT NULL,
  \`action_type\` varchar(50) DEFAULT 'Move to Production',
  \`date_time\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`department\` varchar(255) DEFAULT 'General',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('general_movement_log');
};
