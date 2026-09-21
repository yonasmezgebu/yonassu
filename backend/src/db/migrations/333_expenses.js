// Migration step 333 of 362
// Creates table: expenses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`expenses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`category_id\` int(11) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`date\` date NOT NULL,
  \`description\` text NOT NULL,
  \`receipt_path\` varchar(255) DEFAULT NULL,
  \`payment_method_id\` int(11) NOT NULL,
  \`reference_number\` varchar(100) DEFAULT NULL,
  \`entered_by\` int(11) NOT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`approved_at\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`deleted_at\` datetime DEFAULT NULL,
  \`approval_tier\` varchar(20) DEFAULT NULL,
  \`payment_status\` varchar(30) DEFAULT 'unpaid',
  \`budget_id\` int(10) unsigned DEFAULT NULL,
  \`encumbered_amount\` decimal(15,2) DEFAULT '0.00',
  \`currency\` varchar(3) DEFAULT 'ETB',
  \`exchange_rate\` decimal(15,6) DEFAULT '1.000000',
  \`tax_amount\` decimal(15,2) DEFAULT '0.00',
  \`withholding_tax\` decimal(15,2) DEFAULT '0.00',
  \`vat_amount\` decimal(15,2) DEFAULT '0.00',
  \`net_amount\` decimal(15,2) DEFAULT '0.00',
  \`payment_processor_id\` int(10) unsigned DEFAULT NULL,
  \`payment_processed_at\` timestamp NULL DEFAULT NULL,
  \`payment_reference\` varchar(100) DEFAULT NULL,
  \`po_id\` int(10) unsigned DEFAULT NULL,
  \`grn_id\` int(10) unsigned DEFAULT NULL,
  \`coa_id\` int(10) unsigned DEFAULT NULL,
  \`is_encumbered\` tinyint(1) DEFAULT '0',
  \`encumbered_at\` timestamp NULL DEFAULT NULL,
  \`de_encumbered_at\` timestamp NULL DEFAULT NULL,
  \`erca_declaration_ref\` varchar(50) DEFAULT NULL,
  \`tax_declared\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`idx_expenses_category\` (\`category_id\`),
  KEY \`idx_expenses_date\` (\`date\`),
  KEY \`payment_method_id\` (\`payment_method_id\`),
  KEY \`entered_by\` (\`entered_by\`),
  KEY \`approved_by\` (\`approved_by\`),
  CONSTRAINT \`expenses_ibfk_1\` FOREIGN KEY (\`category_id\`) REFERENCES \`expense_categories\` (\`id\`),
  CONSTRAINT \`expenses_ibfk_2\` FOREIGN KEY (\`payment_method_id\`) REFERENCES \`payment_methods\` (\`id\`),
  CONSTRAINT \`expenses_ibfk_3\` FOREIGN KEY (\`entered_by\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`expenses_ibfk_4\` FOREIGN KEY (\`approved_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expenses');
};
