// Migration step 286 of 362
// Creates table: stock_issue_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_issue_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`issue_id\` int(10) unsigned NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`unit_cost\` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`stock_issue_items_issue_id_foreign\` (\`issue_id\`),
  KEY \`stock_issue_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`stock_issue_items_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`),
  CONSTRAINT \`stock_issue_items_issue_id_foreign\` FOREIGN KEY (\`issue_id\`) REFERENCES \`stock_issues\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_issue_items');
};
