// Migration step 21 of 362
// Creates table: car_renting_fuel_service
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`car_renting_fuel_service\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`asset_id\` varchar(255) NOT NULL,
  \`asset_type\` varchar(255) NOT NULL,
  \`asset_name\` varchar(255) NOT NULL,
  \`request_type\` varchar(255) NOT NULL,
  \`description\` text NOT NULL,
  \`estimated_cost_cents\` int(11) NOT NULL,
  \`requested_date\` varchar(255) NOT NULL,
  \`status\` enum('PENDING_CEO','PENDING_FINANCE','FINANCE_READY','PAYMENT_RELEASED','COMPLETED','REJECTED') DEFAULT 'PENDING_CEO',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`priority\` varchar(255) DEFAULT 'Normal',
  \`driver_name\` varchar(255) DEFAULT NULL,
  \`reported_by\` varchar(255) DEFAULT NULL,
  \`current_mileage\` int(11) DEFAULT NULL,
  \`location\` varchar(255) DEFAULT NULL,
  \`notes\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('car_renting_fuel_service');
};
