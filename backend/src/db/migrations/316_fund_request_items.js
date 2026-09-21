// Migration step 316 of 362
// Creates table: fund_request_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`fund_request_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`fund_request_id\` int(10) unsigned NOT NULL,
  \`tender_id\` int(10) unsigned NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`unit_price\` decimal(12,2) NOT NULL,
  \`line_total\` decimal(15,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fund_request_items_fund_request_id_foreign\` (\`fund_request_id\`),
  KEY \`fund_request_items_tender_id_foreign\` (\`tender_id\`),
  KEY \`fund_request_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`fund_request_items_fund_request_id_foreign\` FOREIGN KEY (\`fund_request_id\`) REFERENCES \`fund_requests\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fund_request_items_tender_id_foreign\` FOREIGN KEY (\`tender_id\`) REFERENCES \`tenders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fund_request_items');
};
