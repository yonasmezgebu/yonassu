// Migration step 244 of 362
// Creates table: retail_cart_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_cart_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_cart_items');
};
