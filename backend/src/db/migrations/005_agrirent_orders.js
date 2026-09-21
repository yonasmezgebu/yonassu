// Migration step 5 of 362
// Creates table: agrirent_orders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`agrirent_orders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`order_number\` varchar(30) NOT NULL,
  \`tractor_id\` int(10) unsigned DEFAULT NULL,
  \`customer_id\` int(10) unsigned DEFAULT NULL,
  \`customer_name\` varchar(120) NOT NULL,
  \`customer_phone\` varchar(30) NOT NULL,
  \`customer_email\` varchar(120) DEFAULT NULL,
  \`start_date\` date DEFAULT NULL,
  \`end_date\` date DEFAULT NULL,
  \`total_days\` int(10) unsigned DEFAULT '1',
  \`daily_rate\` decimal(12,2) DEFAULT '0.00',
  \`total_amount\` decimal(12,2) DEFAULT '0.00',
  \`field_location\` varchar(255) DEFAULT NULL,
  \`field_size_hectares\` decimal(8,2) DEFAULT NULL,
  \`farming_purpose\` varchar(100) DEFAULT NULL,
  \`special_instructions\` text,
  \`payment_method\` varchar(30) DEFAULT 'Telebirr',
  \`payment_reference\` varchar(100) DEFAULT NULL,
  \`payment_status\` enum('Pending','Confirmed','Rejected') DEFAULT 'Pending',
  \`finance_notes\` text,
  \`verified_by\` int(10) unsigned DEFAULT NULL,
  \`verified_at\` timestamp NULL DEFAULT NULL,
  \`status\` enum('pending','approved','confirmed','active','completed','cancelled') DEFAULT 'pending',
  \`is_manual\` tinyint(1) DEFAULT '0',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`manager_note\` text,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`cancelled_at\` timestamp NULL DEFAULT NULL,
  \`cancellation_reason\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`deleted_at\` timestamp NULL DEFAULT NULL,
  \`payment_screenshot\` varchar(255) DEFAULT NULL,
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  \`subtotal\` decimal(14,2) DEFAULT '0.00',
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  \`archived_at\` timestamp NULL DEFAULT NULL,
  \`released_at\` timestamp NULL DEFAULT NULL,
  \`completed_at\` timestamp NULL DEFAULT NULL,
  \`scheduled_later\` tinyint(1) DEFAULT '0',
  \`waitlist_id\` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`agrirent_orders_order_number_unique\` (\`order_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('agrirent_orders');
};
