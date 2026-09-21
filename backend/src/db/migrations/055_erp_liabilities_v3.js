// Migration step 55 of 362
// Creates table: erp_liabilities_v3
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_liabilities_v3\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_id\` int(10) unsigned DEFAULT NULL,
  \`liability_type\` varchar(255) DEFAULT 'ACCOUNTS_PAYABLE',
  \`invoice_number\` varchar(255) NOT NULL,
  \`description\` text,
  \`amount\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`paid_amount\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`balance\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`invoice_date\` date DEFAULT NULL,
  \`due_date\` date DEFAULT NULL,
  \`status\` varchar(255) NOT NULL DEFAULT 'Pending',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_liabilities_v3');
};
