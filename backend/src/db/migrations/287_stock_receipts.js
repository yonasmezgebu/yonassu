// Migration step 287 of 362
// Creates table: stock_receipts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_receipts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`receipt_no\` varchar(50) NOT NULL,
  \`supplier_id\` int(10) unsigned DEFAULT NULL,
  \`supplier_name\` varchar(255) DEFAULT NULL,
  \`purchase_order_ref\` varchar(100) DEFAULT NULL,
  \`delivery_note_ref\` varchar(100) DEFAULT NULL,
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`receipt_date\` date DEFAULT NULL,
  \`remarks\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`stock_receipts_receipt_no_unique\` (\`receipt_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_receipts');
};
