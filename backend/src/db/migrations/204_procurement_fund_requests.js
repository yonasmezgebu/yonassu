// Migration step 204 of 362
// Creates table: procurement_fund_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`procurement_fund_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tender_id\` int(10) unsigned NOT NULL,
  \`tender_no\` varchar(30) NOT NULL,
  \`procurement_request_id\` int(10) unsigned NOT NULL,
  \`pr_no\` varchar(30) NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`status\` enum('PENDING_CEO_APPROVAL','APPROVED','REJECTED') DEFAULT 'PENDING_CEO_APPROVAL',
  \`ceo_decision\` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  \`ceo_notes\` text,
  \`ceo_decided_by\` int(11) DEFAULT NULL,
  \`ceo_decided_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`requested_by\` int(11) NOT NULL,
  \`requested_by_name\` varchar(100) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`new_drug_flag\` varchar(10) DEFAULT 'NO',
  \`vat_amount\` decimal(14,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`procurement_fund_requests_tender_id_foreign\` (\`tender_id\`),
  CONSTRAINT \`procurement_fund_requests_tender_id_foreign\` FOREIGN KEY (\`tender_id\`) REFERENCES \`procurement_tenders\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('procurement_fund_requests');
};
