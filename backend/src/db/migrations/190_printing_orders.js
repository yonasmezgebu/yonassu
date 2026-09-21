// Migration step 190 of 362
// Creates table: printing_orders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`printing_orders\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`order_number\` varchar(20) NOT NULL,
  \`customer_id\` int(11) NOT NULL,
  \`customer_type_id\` int(11) NOT NULL,
  \`product_type\` varchar(50) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`paper_type\` varchar(10) NOT NULL,
  \`pages_per_copy\` int(11) NOT NULL,
  \`color_printing\` tinyint(1) DEFAULT '0',
  \`binding_type\` varchar(20) DEFAULT 'None',
  \`due_date\` date NOT NULL,
  \`special_instructions\` text,
  \`attachments\` json DEFAULT NULL,
  \`price_per_unit\` decimal(15,2) NOT NULL,
  \`binding_cost\` decimal(15,2) DEFAULT '0.00',
  \`total_price\` decimal(15,2) NOT NULL,
  \`status_id\` int(11) NOT NULL,
  \`created_by\` int(11) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`completed_at\` datetime DEFAULT NULL,
  \`deleted_at\` datetime DEFAULT NULL,
  \`payment_method\` varchar(255) DEFAULT NULL,
  \`payment_reference\` varchar(255) DEFAULT NULL,
  \`payment_status\` varchar(255) DEFAULT 'Pending',
  \`payment_proof_path\` varchar(255) DEFAULT NULL,
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  \`subtotal\` decimal(14,2) DEFAULT '0.00',
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`order_number\` (\`order_number\`),
  KEY \`idx_orders_number\` (\`order_number\`),
  KEY \`idx_orders_customer\` (\`customer_id\`),
  KEY \`idx_orders_status\` (\`status_id\`),
  KEY \`idx_orders_due_date\` (\`due_date\`),
  KEY \`customer_type_id\` (\`customer_type_id\`),
  KEY \`created_by\` (\`created_by\`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('printing_orders');
};
