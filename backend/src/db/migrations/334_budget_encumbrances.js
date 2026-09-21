// Migration step 334 of 362
// Creates table: budget_encumbrances
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`budget_encumbrances\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`budget_item_id\` int(10) unsigned NOT NULL,
  \`expense_id\` int(11) DEFAULT NULL,
  \`purchase_order_id\` int(10) unsigned DEFAULT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`status\` enum('encumbered','disbursed','released','cancelled') DEFAULT 'encumbered',
  \`encumbered_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`disbursed_at\` timestamp NULL DEFAULT NULL,
  \`released_at\` timestamp NULL DEFAULT NULL,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`notes\` text,
  PRIMARY KEY (\`id\`),
  KEY \`budget_encumbrances_budget_item_id_foreign\` (\`budget_item_id\`),
  KEY \`budget_encumbrances_expense_id_foreign\` (\`expense_id\`),
  CONSTRAINT \`budget_encumbrances_budget_item_id_foreign\` FOREIGN KEY (\`budget_item_id\`) REFERENCES \`budget_items\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`budget_encumbrances_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('budget_encumbrances');
};
