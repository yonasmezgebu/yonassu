// Migration step 297 of 362
// Creates table: store_approved_request_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_approved_request_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`approval_id\` int(10) unsigned NOT NULL,
  \`item_name\` varchar(255) DEFAULT NULL,
  \`drug_id\` int(10) unsigned DEFAULT NULL,
  \`quantity_approved\` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`store_approved_request_items_approval_id_foreign\` (\`approval_id\`),
  KEY \`store_approved_request_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`store_approved_request_items_approval_id_foreign\` FOREIGN KEY (\`approval_id\`) REFERENCES \`store_approved_requests\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`store_approved_request_items_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_approved_request_items');
};
