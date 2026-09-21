// Migration step 203 of 362
// Creates table: procurement_bids
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_bids\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tender_id\` int(10) unsigned NOT NULL,
  \`tender_no\` varchar(30) NOT NULL,
  \`supplier_user_id\` int(11) NOT NULL,
  \`supplier_name\` varchar(255) NOT NULL,
  \`supplier_contact\` varchar(100) DEFAULT NULL,
  \`unit_price\` decimal(15,2) NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`delivery_days\` int(11) DEFAULT NULL,
  \`validity_period\` varchar(50) DEFAULT NULL,
  \`bid_document_path\` text,
  \`status\` enum('SUBMITTED','SHORTLISTED','AWARDED','REJECTED') DEFAULT 'SUBMITTED',
  \`submitted_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`procurement_bids_tender_id_foreign\` (\`tender_id\`),
  CONSTRAINT \`procurement_bids_tender_id_foreign\` FOREIGN KEY (\`tender_id\`) REFERENCES \`procurement_tenders\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_bids');
};
