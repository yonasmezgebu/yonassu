// Migration step 246 of 362
// Creates table: retail_orders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_orders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`customer_id\` int(11) DEFAULT NULL,
  \`invoice_number\` varchar(255) NOT NULL,
  \`subtotal\` decimal(12,2) DEFAULT '0.00',
  \`tax\` decimal(12,2) DEFAULT '0.00',
  \`delivery_fee\` decimal(10,2) DEFAULT '0.00',
  \`total_amount\` decimal(12,2) NOT NULL,
  \`status\` enum('PROCESSING','PACKING','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'PROCESSING',
  \`payment_status\` enum('AWAITING_PAYMENT','PENDING','PAID','OVERDUE') DEFAULT 'AWAITING_PAYMENT',
  \`payment_method\` enum('cash','bank_transfer','telebirr','credit') DEFAULT 'cash',
  \`delivery_type\` enum('pickup','delivery') DEFAULT 'pickup',
  \`delivery_address\` varchar(255) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`customer_name\` varchar(200) DEFAULT NULL,
  \`customer_phone\` varchar(50) DEFAULT NULL,
  \`customer_email\` varchar(255) DEFAULT NULL,
  \`payment_ref\` varchar(255) DEFAULT NULL,
  \`payment_proof_path\` varchar(500) DEFAULT NULL,
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`retail_orders_invoice_number_unique\` (\`invoice_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_orders');
};
