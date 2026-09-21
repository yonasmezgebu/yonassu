// Migration step 260 of 362
// Creates table: sales_invoices
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_invoices\` (
  \`id\` varchar(50) NOT NULL,
  \`invoice_no\` varchar(50) NOT NULL,
  \`source\` varchar(20) NOT NULL,
  \`sale_id\` int(10) unsigned NOT NULL,
  \`customer_name\` varchar(255) DEFAULT NULL,
  \`customer_tin\` varchar(50) DEFAULT NULL,
  \`subtotal\` decimal(15,2) DEFAULT '0.00',
  \`vat_standard\` decimal(15,2) DEFAULT '0.00',
  \`vat_standard_rate\` decimal(5,2) DEFAULT '0.15',
  \`vat_exempt\` decimal(15,2) DEFAULT '0.00',
  \`vat_zero_rated\` decimal(15,2) DEFAULT '0.00',
  \`vat_total\` decimal(15,2) DEFAULT '0.00',
  \`total_amount\` decimal(15,2) DEFAULT '0.00',
  \`status\` varchar(20) DEFAULT 'active',
  \`created_by_name\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`sale_type\` varchar(50) DEFAULT 'walk_in',
  \`notes\` text,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`sales_invoices_invoice_no_unique\` (\`invoice_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_invoices');
};
