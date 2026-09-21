// Migration step 261 of 362
// Creates table: sales_invoice_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_invoice_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`invoice_id\` varchar(50) NOT NULL,
  \`item_id\` int(10) unsigned DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`qty\` decimal(10,2) NOT NULL DEFAULT '1.00',
  \`unit_price\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`cost_price\` decimal(15,2) DEFAULT NULL,
  \`treatment\` varchar(20) NOT NULL,
  \`rate\` decimal(5,2) NOT NULL DEFAULT '0.00',
  \`vat_amount\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`subtotal\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`total\` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`sales_invoice_items_invoice_id_foreign\` (\`invoice_id\`),
  CONSTRAINT \`sales_invoice_items_invoice_id_foreign\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`sales_invoices\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_invoice_items');
};
