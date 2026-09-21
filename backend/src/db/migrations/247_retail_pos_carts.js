// Migration step 247 of 362
// Creates table: retail_pos_carts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_pos_carts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`cart_code\` varchar(255) DEFAULT NULL,
  \`cashier_id\` int(11) DEFAULT NULL,
  \`cashier_name\` varchar(255) DEFAULT NULL,
  \`customer_name\` varchar(255) DEFAULT NULL,
  \`customer_phone\` varchar(255) DEFAULT NULL,
  \`payment_method\` varchar(255) DEFAULT NULL,
  \`payment_amount\` decimal(12,2) DEFAULT NULL,
  \`payment_reference\` varchar(255) DEFAULT NULL,
  \`bank_name\` varchar(255) DEFAULT NULL,
  \`account_number\` varchar(255) DEFAULT NULL,
  \`telbir_number\` varchar(255) DEFAULT NULL,
  \`txn_id\` varchar(255) DEFAULT NULL,
  \`total_amount\` decimal(12,2) DEFAULT NULL,
  \`items\` text,
  \`finance_submission_id\` int(11) DEFAULT NULL,
  \`store_request_id\` int(11) DEFAULT NULL,
  \`status\` varchar(255) DEFAULT NULL,
  \`sales_manager_signature\` text,
  \`signature_timestamp\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`retail_pos_carts_cart_code_unique\` (\`cart_code\`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_pos_carts');
};
