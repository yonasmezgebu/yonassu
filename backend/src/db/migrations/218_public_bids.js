// Migration step 218 of 362
// Creates table: public_bids
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_bids\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`public_tender_id\` int(10) unsigned DEFAULT NULL,
  \`competitor_name\` varchar(255) NOT NULL,
  \`digital_signature_text\` text,
  \`hand_signature_path\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`email\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(255) DEFAULT NULL,
  \`delivery_time\` varchar(255) DEFAULT NULL,
  \`payment_terms\` varchar(255) DEFAULT NULL,
  \`bid_status\` varchar(255) DEFAULT 'pending',
  \`recommendation_reason\` text,
  \`ceo_read\` tinyint(1) DEFAULT '0',
  \`is_deleted_by_customer\` tinyint(1) DEFAULT '0',
  \`terms_conditions\` text,
  \`payment_method\` varchar(255) DEFAULT NULL,
  \`payment_status\` varchar(255) DEFAULT 'pending',
  \`customer_cancelled\` tinyint(1) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`public_bids_public_tender_id_foreign\` (\`public_tender_id\`),
  CONSTRAINT \`public_bids_public_tender_id_foreign\` FOREIGN KEY (\`public_tender_id\`) REFERENCES \`public_tenders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_bids');
};
