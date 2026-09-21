// Migration step 24 of 362
// Creates table: car_renting_store_request_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`car_renting_store_request_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_id\` int(10) unsigned NOT NULL,
  \`product_id\` int(10) unsigned NOT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`quantity_shipped\` int(11) DEFAULT NULL,
  \`unit_price\` decimal(10,2) DEFAULT NULL,
  \`notes\` text,
  PRIMARY KEY (\`id\`),
  KEY \`request_id\` (\`request_id\`),
  CONSTRAINT \`car_renting_store_request_items_ibfk_1\` FOREIGN KEY (\`request_id\`) REFERENCES \`car_renting_store_requests\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('car_renting_store_request_items');
};
