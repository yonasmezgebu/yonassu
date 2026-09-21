// Migration step 85 of 362
// Creates table: finance_supplier_bills
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_supplier_bills\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`bill_number\` varchar(40) DEFAULT NULL,
  \`supplier_id\` int(11) DEFAULT NULL,
  \`supplier_name\` varchar(200) DEFAULT NULL,
  \`date_received\` date DEFAULT NULL,
  \`due_date\` date DEFAULT NULL,
  \`po_reference\` varchar(100) DEFAULT NULL,
  \`subtotal\` decimal(14,2) DEFAULT '0.00',
  \`tax_amount\` decimal(14,2) DEFAULT '0.00',
  \`total_amount\` decimal(14,2) DEFAULT '0.00',
  \`amount_paid\` decimal(14,2) DEFAULT '0.00',
  \`status\` varchar(20) DEFAULT 'Unpaid',
  \`items\` json DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`finance_supplier_bills_bill_number_unique\` (\`bill_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_supplier_bills');
};
