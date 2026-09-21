// Migration step 294 of 362
// Creates table: store_purchase_research
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_purchase_research\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`request_number\` varchar(50) NOT NULL,
  \`product_name\` varchar(255) NOT NULL,
  \`quantity_requested\` int(11) NOT NULL DEFAULT '1',
  \`reason\` text,
  \`current_stock\` int(11) DEFAULT '0',
  \`requested_by\` int(11) NOT NULL,
  \`ceo_handler\` int(11) DEFAULT NULL,
  \`market_handler\` int(11) DEFAULT NULL,
  \`ceo_instructions\` text,
  \`research_findings\` text,
  \`research_prices\` text,
  \`research_suppliers\` text,
  \`research_quality\` text,
  \`research_availability\` text,
  \`research_notes\` text,
  \`research_attachments\` json DEFAULT NULL,
  \`rejection_reason\` text,
  \`approval_instructions\` text,
  \`status\` enum('PENDING_PURCHASE','PENDING_CEO','MARKET_STUDY','RESULTS_SUBMITTED','APPROVED','REJECTED') DEFAULT 'PENDING_PURCHASE',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`request_number\` (\`request_number\`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_purchase_research');
};
