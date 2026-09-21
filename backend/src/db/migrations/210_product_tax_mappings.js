// Migration step 210 of 362
// Creates table: product_tax_mappings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`product_tax_mappings\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`vat_config_id\` int(10) unsigned NOT NULL,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`source\` varchar(50) NOT NULL DEFAULT 'retail',
  \`item_id\` bigint(20) unsigned DEFAULT NULL,
  \`item_name\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_mapping_source_item\` (\`source\`,\`item_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_tax_mappings');
};
