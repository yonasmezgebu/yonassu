// Migration step 298 of 362
// Creates table: store_requisition_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_requisition_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`requisition_id\` int(10) unsigned NOT NULL,
  \`item_name\` varchar(255) DEFAULT NULL,
  \`drug_id\` int(10) unsigned DEFAULT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`quantity_approved\` int(11) DEFAULT NULL,
  \`quantity_issued\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`store_requisition_items_requisition_id_foreign\` (\`requisition_id\`),
  KEY \`store_requisition_items_drug_id_foreign\` (\`drug_id\`),
  CONSTRAINT \`store_requisition_items_drug_id_foreign\` FOREIGN KEY (\`drug_id\`) REFERENCES \`drugs\` (\`id\`),
  CONSTRAINT \`store_requisition_items_requisition_id_foreign\` FOREIGN KEY (\`requisition_id\`) REFERENCES \`store_requisitions\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_requisition_items');
};
