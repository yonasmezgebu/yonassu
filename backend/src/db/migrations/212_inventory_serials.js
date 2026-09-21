// Migration step 212 of 362
// Creates table: inventory_serials
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`inventory_serials\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`serial_number\` varchar(100) NOT NULL,
  \`status\` enum('In Stock','Sold','Damaged','Lost') DEFAULT 'In Stock',
  \`location\` varchar(255) DEFAULT NULL,
  \`reference_type\` varchar(50) DEFAULT NULL,
  \`reference_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_product_serial\` (\`product_id\`,\`serial_number\`),
  CONSTRAINT \`inventory_serials_ibfk_1\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_serials');
};
