// Migration step 154 of 362
// Creates table: pharmacy_dispenses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_dispenses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`customer_name\` varchar(255) NOT NULL,
  \`notes\` text,
  \`items\` json NOT NULL,
  \`total_items\` int(11) NOT NULL DEFAULT '0',
  \`dispensed_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_dispenses');
};
