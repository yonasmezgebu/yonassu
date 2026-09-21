// Migration step 183 of 362
// Creates table: pos_sales
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pos_sales\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`invoice_number\` varchar(100) DEFAULT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`subtotal\` decimal(15,2) NOT NULL,
  \`tax_amount\` decimal(15,2) DEFAULT '0.00',
  \`discount_amount\` decimal(15,2) DEFAULT '0.00',
  \`total_amount\` decimal(15,2) NOT NULL,
  \`payment_method_id\` int(11) NOT NULL,
  \`payment_reference\` varchar(100) DEFAULT NULL,
  \`amount_paid\` decimal(15,2) NOT NULL,
  \`change_amount\` decimal(15,2) DEFAULT '0.00',
  \`cashier_id\` int(11) NOT NULL,
  \`sale_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`status_id\` int(11) NOT NULL,
  \`voided_by\` int(11) DEFAULT NULL,
  \`void_reason\` text,
  \`deleted_at\` datetime DEFAULT NULL,
  \`notes\` text,
  \`sale_type\` enum('walk_in','online') DEFAULT 'walk_in',
  \`order_source\` varchar(255) DEFAULT NULL,
  \`order_id\` int(10) unsigned DEFAULT NULL,
  \`manager_approved\` tinyint(1) DEFAULT '1',
  \`manager_approved_by\` int(10) unsigned DEFAULT NULL,
  \`manager_approved_at\` timestamp NULL DEFAULT NULL,
  \`manager_flag_reason\` text,
  \`is_submitted\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`invoice_number\` (\`invoice_number\`),
  KEY \`idx_pos_invoice\` (\`invoice_number\`),
  KEY \`idx_pos_customer\` (\`customer_id\`),
  KEY \`idx_pos_date\` (\`sale_date\`),
  KEY \`payment_method_id\` (\`payment_method_id\`),
  KEY \`status_id\` (\`status_id\`),
  KEY \`cashier_id\` (\`cashier_id\`),
  KEY \`voided_by\` (\`voided_by\`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_sales');
};
