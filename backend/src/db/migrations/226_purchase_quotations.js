// Migration step 226 of 362
// Creates table: purchase_quotations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`purchase_quotations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`quotation_no\` varchar(50) DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`supplier_name\` varchar(255) NOT NULL,
  \`item_description\` varchar(255) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`unit\` varchar(50) DEFAULT NULL,
  \`unit_price\` decimal(15,2) NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`date_agreed\` date DEFAULT NULL,
  \`agreed_via\` varchar(100) DEFAULT NULL,
  \`notes\` text,
  \`status\` varchar(50) DEFAULT 'Pending CEO Approval',
  \`recorded_by\` int(11) DEFAULT NULL,
  \`converted_to_delivery_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`vat_rate\` decimal(5,2) DEFAULT '15.00',
  \`vat_amount\` decimal(15,2) DEFAULT '0.00',
  \`ceo_approved_by\` int(10) unsigned DEFAULT NULL,
  \`ceo_approved_at\` timestamp NULL DEFAULT NULL,
  \`ceo_rejection_reason\` text,
  \`destination\` varchar(20) NOT NULL DEFAULT 'general' COMMENT '''general'' | ''pharmacy''',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`quotation_no\` (\`quotation_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_quotations');
};
