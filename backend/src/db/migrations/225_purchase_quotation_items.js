// Migration step 225 of 362
// Creates table: purchase_quotation_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`purchase_quotation_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`quotation_id\` int(10) unsigned NOT NULL,
  \`line_no\` int(11) NOT NULL,
  \`item_description\` varchar(255) DEFAULT NULL,
  \`quantity\` int(11) DEFAULT '1',
  \`unit\` varchar(255) DEFAULT '',
  \`unit_price\` decimal(15,2) NOT NULL,
  \`line_total\` decimal(15,2) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`category\` varchar(100) DEFAULT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`strength\` varchar(50) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_quotation_items');
};
