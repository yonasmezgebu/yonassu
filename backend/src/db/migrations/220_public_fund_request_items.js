// Migration step 220 of 362
// Creates table: public_fund_request_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_fund_request_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`fund_request_id\` int(10) unsigned NOT NULL,
  \`public_tender_id\` int(10) unsigned NOT NULL,
  \`public_bid_id\` int(10) unsigned NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`public_fund_request_items_fund_request_id_foreign\` (\`fund_request_id\`),
  KEY \`public_fund_request_items_public_tender_id_foreign\` (\`public_tender_id\`),
  KEY \`public_fund_request_items_public_bid_id_foreign\` (\`public_bid_id\`),
  CONSTRAINT \`public_fund_request_items_fund_request_id_foreign\` FOREIGN KEY (\`fund_request_id\`) REFERENCES \`public_fund_requests\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`public_fund_request_items_public_bid_id_foreign\` FOREIGN KEY (\`public_bid_id\`) REFERENCES \`public_bids\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`public_fund_request_items_public_tender_id_foreign\` FOREIGN KEY (\`public_tender_id\`) REFERENCES \`public_tenders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_fund_request_items');
};
