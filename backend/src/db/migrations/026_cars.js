// Migration step 26 of 362
// Creates table: cars
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`cars\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`daily_rate\` decimal(10,2) DEFAULT '0.00',
  \`seats\` int(11) DEFAULT '4',
  \`transmission\` varchar(50) DEFAULT 'Manual',
  \`fuel_type\` varchar(50) DEFAULT 'Petrol',
  \`car_type\` varchar(50) DEFAULT 'Sedan',
  \`description\` text,
  \`availability\` varchar(50) DEFAULT 'Available',
  \`image1\` varchar(255) DEFAULT NULL,
  \`image2\` varchar(255) DEFAULT NULL,
  \`image3\` varchar(255) DEFAULT NULL,
  \`image4\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`deleted_at\` timestamp NULL DEFAULT NULL,
  \`asset_value\` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cars');
};
