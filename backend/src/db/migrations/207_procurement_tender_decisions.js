// Migration step 207 of 362
// Creates table: procurement_tender_decisions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_tender_decisions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tender_id\` int(10) unsigned NOT NULL,
  \`tender_no\` varchar(30) NOT NULL,
  \`selected_bid_id\` int(10) unsigned DEFAULT NULL,
  \`decision\` enum('PENDING','APPROVED','REJECTED','RE_TENDER') DEFAULT 'PENDING',
  \`decision_notes\` text,
  \`decided_by\` int(11) NOT NULL,
  \`decided_by_name\` varchar(100) DEFAULT NULL,
  \`decided_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`procurement_tender_decisions_tender_id_foreign\` (\`tender_id\`),
  KEY \`procurement_tender_decisions_selected_bid_id_foreign\` (\`selected_bid_id\`),
  CONSTRAINT \`procurement_tender_decisions_selected_bid_id_foreign\` FOREIGN KEY (\`selected_bid_id\`) REFERENCES \`procurement_bids\` (\`id\`),
  CONSTRAINT \`procurement_tender_decisions_tender_id_foreign\` FOREIGN KEY (\`tender_id\`) REFERENCES \`procurement_tenders\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_tender_decisions');
};
