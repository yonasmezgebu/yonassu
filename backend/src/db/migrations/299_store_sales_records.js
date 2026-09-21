// Migration step 299 of 362
// Creates table: store_sales_records
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_sales_records\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`sale_code\` varchar(100) DEFAULT NULL,
  \`request_id\` int(10) unsigned NOT NULL,
  \`product_id\` varchar(100) DEFAULT NULL,
  \`product_name\` varchar(300) DEFAULT NULL,
  \`quantity_sold\` int(11) NOT NULL,
  \`sold_by_id\` int(10) unsigned DEFAULT NULL,
  \`sold_by_name\` varchar(300) DEFAULT NULL,
  \`customer_name\` varchar(300) DEFAULT NULL,
  \`customer_phone\` varchar(50) DEFAULT NULL,
  \`unit_value\` decimal(14,2) DEFAULT NULL,
  \`total_value\` decimal(14,2) DEFAULT NULL,
  \`sale_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_sales_records_sale_code_unique\` (\`sale_code\`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_sales_records');
};
