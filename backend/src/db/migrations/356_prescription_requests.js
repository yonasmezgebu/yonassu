// Migration step 356 of 362
// Creates table: prescription_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`prescription_requests\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`request_number\` varchar(50) NOT NULL,
  \`customer_id\` int(11) NOT NULL,
  \`customer_name\` varchar(100) DEFAULT NULL,
  \`customer_email\` varchar(100) DEFAULT NULL,
  \`customer_phone\` varchar(50) DEFAULT NULL,
  \`medication_id\` int(11) NOT NULL,
  \`medication_name\` varchar(200) DEFAULT NULL,
  \`quantity\` int(11) NOT NULL,
  \`price_per_unit\` decimal(10,2) DEFAULT NULL,
  \`total_amount\` decimal(10,2) DEFAULT NULL,
  \`prescription_image\` varchar(255) DEFAULT NULL,
  \`delivery_option\` enum('pickup','delivery') DEFAULT 'pickup',
  \`delivery_address\` text,
  \`delivery_fee\` decimal(10,2) DEFAULT '0.00',
  \`subtotal\` decimal(12,2) DEFAULT NULL,
  \`tax_amount\` decimal(12,2) DEFAULT NULL,
  \`status\` enum('pending','approved','rejected','ready_for_pickup','picked_up','delivered') DEFAULT 'pending',
  \`rejection_reason\` text,
  \`requested_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`approved_rejected_at\` timestamp NULL DEFAULT NULL,
  \`ready_at\` timestamp NULL DEFAULT NULL,
  \`completed_at\` timestamp NULL DEFAULT NULL,
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`request_number\` (\`request_number\`),
  KEY \`customer_id\` (\`customer_id\`),
  KEY \`medication_id\` (\`medication_id\`),
  CONSTRAINT \`prescription_requests_ibfk_1\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`prescription_requests_ibfk_2\` FOREIGN KEY (\`medication_id\`) REFERENCES \`pharmacy_medications\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('prescription_requests');
};
