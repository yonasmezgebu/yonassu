// Migration step 219 of 362
// Creates table: public_deliveries
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_deliveries\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`public_tender_id\` int(10) unsigned NOT NULL,
  \`status\` enum('PENDING','RECEIVED','ISSUE_REPORTED') DEFAULT 'PENDING',
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`received_at\` datetime DEFAULT NULL,
  \`notes\` text,
  \`store_read\` tinyint(1) DEFAULT '0',
  \`purchase_read\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`public_deliveries_public_tender_id_foreign\` (\`public_tender_id\`),
  CONSTRAINT \`public_deliveries_public_tender_id_foreign\` FOREIGN KEY (\`public_tender_id\`) REFERENCES \`public_tenders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_deliveries');
};
