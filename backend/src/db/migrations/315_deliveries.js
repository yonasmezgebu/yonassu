// Migration step 315 of 362
// Creates table: deliveries
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`deliveries\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`tender_id\` int(10) unsigned NOT NULL,
  \`delivery_type\` enum('VIA_STORE','DIRECT_TO_PHARMACY') NOT NULL,
  \`received_by\` int(10) unsigned DEFAULT NULL,
  \`received_at\` datetime DEFAULT NULL,
  \`status\` enum('PENDING','RECEIVED','ISSUE_REPORTED') DEFAULT 'PENDING',
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`deliveries_tender_id_foreign\` (\`tender_id\`),
  CONSTRAINT \`deliveries_tender_id_foreign\` FOREIGN KEY (\`tender_id\`) REFERENCES \`tenders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('deliveries');
};
