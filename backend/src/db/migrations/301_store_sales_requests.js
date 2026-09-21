// Migration step 301 of 362
// Creates table: store_sales_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_sales_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_code\` varchar(100) DEFAULT NULL,
  \`store_module\` varchar(50) DEFAULT 'general_store',
  \`product_id\` varchar(100) DEFAULT NULL,
  \`product_name\` varchar(300) NOT NULL,
  \`unit\` varchar(50) DEFAULT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`customer_name\` varchar(300) DEFAULT NULL,
  \`customer_phone\` varchar(50) DEFAULT NULL,
  \`requested_by_id\` int(10) unsigned DEFAULT NULL,
  \`requested_by_name\` varchar(300) DEFAULT NULL,
  \`digital_signature\` text,
  \`signature_timestamp\` timestamp NULL DEFAULT NULL,
  \`notes\` varchar(1000) DEFAULT NULL,
  \`status\` enum('Pending','Approved','Released','Sold','Rejected') DEFAULT 'Pending',
  \`rejection_reason\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`cart_items\` text,
  \`retail_cart_id\` int(11) DEFAULT NULL,
  \`store_keeper_signature\` text,
  \`store_keeper_notes\` text,
  \`payment_method\` varchar(50) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_sales_requests_request_code_unique\` (\`request_code\`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_sales_requests');
};
