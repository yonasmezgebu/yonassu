// Migration step 153 of 362
// Creates table: pharmacy_direct_deliveries
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_direct_deliveries\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`delivery_no\` varchar(50) NOT NULL,
  \`supplier_name\` varchar(255) NOT NULL,
  \`drug_name\` varchar(255) NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`unit_of_measure\` varchar(50) DEFAULT 'Units',
  \`unit_price\` decimal(12,2) NOT NULL DEFAULT '0.00',
  \`total_amount\` decimal(12,2) NOT NULL DEFAULT '0.00',
  \`delivery_date\` date NOT NULL,
  \`invoice_no\` varchar(100) DEFAULT NULL,
  \`notes\` text,
  \`received_by\` int(11) DEFAULT NULL,
  \`received_by_name\` varchar(100) DEFAULT NULL,
  \`status\` enum('PENDING_CEO','CEO_CONFIRMED','CEO_REJECTED','FINANCE_PAID') DEFAULT 'PENDING_CEO',
  \`ceo_confirmed_at\` timestamp NULL DEFAULT NULL,
  \`ceo_confirmed_by\` int(11) DEFAULT NULL,
  \`ceo_notes\` text,
  \`finance_payable_id\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`delivery_no\` (\`delivery_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_direct_deliveries');
};
