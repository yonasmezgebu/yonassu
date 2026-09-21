// Migration step 22 of 362
// Creates table: car_renting_maintenance
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`car_renting_maintenance\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`asset_id\` varchar(255) NOT NULL,
  \`asset_type\` varchar(255) NOT NULL,
  \`asset_name\` varchar(255) NOT NULL,
  \`type\` varchar(255) NOT NULL,
  \`description\` text NOT NULL,
  \`estimated_cost_cents\` int(11) NOT NULL,
  \`scheduled_date\` varchar(255) NOT NULL,
  \`status\` enum('PENDING_CEO','PENDING_FINANCE','FINANCE_READY','FINANCE_APPROVED','PAYMENT_RELEASED','COMPLETED','REJECTED') DEFAULT 'PENDING_CEO',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`priority\` varchar(255) DEFAULT 'Normal',
  \`mechanic_name\` varchar(255) DEFAULT NULL,
  \`mechanic_phone\` varchar(255) DEFAULT NULL,
  \`reported_by\` varchar(255) DEFAULT NULL,
  \`images\` longtext,
  \`notes\` text,
  \`location\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('car_renting_maintenance');
};
