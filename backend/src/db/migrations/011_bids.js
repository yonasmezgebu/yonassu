// Migration step 11 of 362
// Creates table: bids
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`bids\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tender_id\` int(10) unsigned NOT NULL,
  \`customer_id\` int(10) unsigned NOT NULL,
  \`bid_price_per_unit\` decimal(15,2) NOT NULL,
  \`quantity_requested\` int(11) NOT NULL,
  \`total_bid_value\` decimal(15,2) NOT NULL,
  \`proposed_pickup_date\` date DEFAULT NULL,
  \`notes\` text,
  \`status\` varchar(50) NOT NULL DEFAULT 'pending',
  \`evaluation_label\` varchar(20) DEFAULT NULL,
  \`evaluation_notes\` text,
  \`disqualification_reason\` text,
  \`submitted_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`items\` json DEFAULT NULL,
  \`ceo_approval_status\` varchar(255) DEFAULT 'pending',
  \`bidder_full_name\` varchar(255) DEFAULT NULL,
  \`bidder_email\` varchar(255) DEFAULT NULL,
  \`bidder_phone\` varchar(255) DEFAULT NULL,
  \`opened_at\` datetime DEFAULT NULL,
  \`notification_sent\` tinyint(1) DEFAULT '0',
  \`digital_signature\` varchar(255) DEFAULT NULL,
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  \`payment_status\` varchar(255) DEFAULT 'pending',
  \`payment_method\` varchar(255) DEFAULT NULL,
  \`payment_reference\` varchar(500) DEFAULT NULL,
  \`payment_screenshot\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('bids');
};
