// Migration step 337 of 362
// Creates table: expense_taxes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`expense_taxes\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`expense_id\` int(11) NOT NULL,
  \`tax_type\` varchar(30) NOT NULL,
  \`taxable_amount\` decimal(15,2) NOT NULL,
  \`tax_rate\` decimal(5,2) NOT NULL,
  \`tax_amount\` decimal(15,2) NOT NULL,
  \`erca_reference\` varchar(50) DEFAULT NULL,
  \`declared\` tinyint(1) DEFAULT '0',
  \`declared_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`expense_taxes_expense_id_foreign\` (\`expense_id\`),
  CONSTRAINT \`expense_taxes_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expense_taxes');
};
