// Migration step 321 of 362
// Creates table: transfer_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`transfer_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`transfer_request_id\` int(10) unsigned NOT NULL,
  \`drug_id\` int(10) unsigned NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`batch_no\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`transfer_items_transfer_request_id_foreign\` (\`transfer_request_id\`),
  KEY \`transfer_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`transfer_items_transfer_request_id_foreign\` FOREIGN KEY (\`transfer_request_id\`) REFERENCES \`transfer_requests\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transfer_items');
};
