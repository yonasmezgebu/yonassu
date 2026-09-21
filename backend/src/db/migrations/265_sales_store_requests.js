// Migration step 265 of 362
// Creates table: sales_store_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_store_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(255) DEFAULT NULL,
  \`material_id\` varchar(255) DEFAULT NULL,
  \`quantity_requested\` int(11) DEFAULT NULL,
  \`department\` varchar(255) DEFAULT 'Sales',
  \`created_by_name\` varchar(255) DEFAULT NULL,
  \`status\` varchar(255) DEFAULT 'Pending',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`quantity_shipped\` int(11) DEFAULT '0',
  \`signature\` varchar(10000) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`sales_store_requests_request_code_unique\` (\`request_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_store_requests');
};
