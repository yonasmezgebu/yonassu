// Migration step 69 of 362
// Creates table: budget_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`budget_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`budget_period_id\` int(10) unsigned NOT NULL,
  \`category_id\` int(11) DEFAULT NULL,
  \`coa_id\` int(10) unsigned DEFAULT NULL,
  \`allocated_amount\` decimal(15,2) NOT NULL,
  \`encumbered_amount\` decimal(15,2) DEFAULT '0.00',
  \`spent_amount\` decimal(15,2) DEFAULT '0.00',
  \`remaining_amount\` decimal(15,2) DEFAULT '0.00',
  \`notes\` text,
  PRIMARY KEY (\`id\`),
  KEY \`budget_items_budget_period_id_foreign\` (\`budget_period_id\`),
  KEY \`budget_items_category_id_foreign\` (\`category_id\`),
  KEY \`budget_items_coa_id_foreign\` (\`coa_id\`),
  CONSTRAINT \`budget_items_budget_period_id_foreign\` FOREIGN KEY (\`budget_period_id\`) REFERENCES \`budget_periods\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`budget_items_category_id_foreign\` FOREIGN KEY (\`category_id\`) REFERENCES \`expense_categories\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`budget_items_coa_id_foreign\` FOREIGN KEY (\`coa_id\`) REFERENCES \`chart_of_accounts\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('budget_items');
};
