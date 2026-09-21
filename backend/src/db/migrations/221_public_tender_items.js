// Migration step 221 of 362
// Creates table: public_tender_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`public_tender_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`public_tender_id\` int(10) unsigned DEFAULT NULL,
  \`object_type\` varchar(255) NOT NULL,
  \`unit\` varchar(255) DEFAULT NULL,
  \`quantity\` decimal(14,2) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`public_tender_items_public_tender_id_foreign\` (\`public_tender_id\`),
  CONSTRAINT \`public_tender_items_public_tender_id_foreign\` FOREIGN KEY (\`public_tender_id\`) REFERENCES \`public_tenders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('public_tender_items');
};
