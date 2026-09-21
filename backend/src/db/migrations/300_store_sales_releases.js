// Migration step 300 of 362
// Creates table: store_sales_releases
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_sales_releases\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_id\` int(10) unsigned NOT NULL,
  \`released_by_id\` int(10) unsigned DEFAULT NULL,
  \`released_by_name\` varchar(300) DEFAULT NULL,
  \`quantity_released\` int(11) NOT NULL,
  \`remaining_stock\` decimal(14,2) DEFAULT NULL,
  \`release_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`notes\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_sales_releases');
};
