// Migration step 314 of 362
// Creates table: tenders
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`tenders\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`reference_number\` varchar(20) NOT NULL,
  \`title\` varchar(200) NOT NULL,
  \`description\` text NOT NULL,
  \`item_ids\` json DEFAULT NULL,
  \`item_name\` varchar(255) DEFAULT NULL,
  \`quantity\` int(11) NOT NULL,
  \`starting_bid_price\` decimal(15,2) NOT NULL,
  \`deadline\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`terms_conditions\` text NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'draft',
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`awarded_bid_id\` int(10) unsigned DEFAULT NULL,
  \`sales_order_id\` int(10) unsigned DEFAULT NULL,
  \`cancellation_reason\` text,
  \`category\` varchar(100) DEFAULT NULL,
  \`attachments\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`is_new_drug\` tinyint(1) DEFAULT '0',
  \`is_hidden\` tinyint(1) DEFAULT '0',
  \`deadline_notified\` tinyint(1) DEFAULT '0',
  \`items\` json DEFAULT NULL,
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  \`cpo_amount\` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`tenders_reference_number_unique\` (\`reference_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tenders');
};
