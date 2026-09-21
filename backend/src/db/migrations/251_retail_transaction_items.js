// Migration step 251 of 362
// Creates table: retail_transaction_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_transaction_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`transaction_id\` int(11) DEFAULT NULL,
  \`product_id\` int(11) DEFAULT NULL,
  \`quantity\` decimal(10,2) DEFAULT NULL,
  \`unit_price\` decimal(10,2) DEFAULT NULL,
  \`line_total\` decimal(10,2) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_transaction_items');
};
