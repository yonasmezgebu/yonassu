// Migration step 71 of 362
// Creates table: farming_store_request_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`farming_store_request_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_id\` int(10) unsigned NOT NULL,
  \`product_id\` int(10) unsigned NOT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`quantity_shipped\` int(11) DEFAULT NULL,
  \`unit_price\` decimal(10,2) DEFAULT NULL,
  \`notes\` text,
  PRIMARY KEY (\`id\`),
  KEY \`request_id\` (\`request_id\`),
  CONSTRAINT \`farming_store_request_items_ibfk_1\` FOREIGN KEY (\`request_id\`) REFERENCES \`farming_store_requests\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('farming_store_request_items');
};
