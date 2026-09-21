// Migration step 222 of 362
// Creates table: public_bid_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_bid_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`public_bid_id\` int(10) unsigned DEFAULT NULL,
  \`public_tender_item_id\` int(10) unsigned DEFAULT NULL,
  \`price_birr\` bigint(20) NOT NULL,
  \`price_cent\` int(11) NOT NULL,
  \`total_birr\` bigint(20) NOT NULL,
  \`total_cent\` int(11) NOT NULL,
  \`checkup\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`public_bid_items_public_bid_id_foreign\` (\`public_bid_id\`),
  KEY \`public_bid_items_public_tender_item_id_foreign\` (\`public_tender_item_id\`),
  CONSTRAINT \`public_bid_items_public_bid_id_foreign\` FOREIGN KEY (\`public_bid_id\`) REFERENCES \`public_bids\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`public_bid_items_public_tender_item_id_foreign\` FOREIGN KEY (\`public_tender_item_id\`) REFERENCES \`public_tender_items\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_bid_items');
};
