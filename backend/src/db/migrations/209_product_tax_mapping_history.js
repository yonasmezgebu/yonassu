// Migration step 209 of 362
// Creates table: product_tax_mapping_history
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`product_tax_mapping_history\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`product_name\` varchar(255) DEFAULT NULL,
  \`old_vat_config_id\` int(10) unsigned DEFAULT NULL,
  \`old_treatment\` varchar(50) DEFAULT NULL,
  \`new_vat_config_id\` int(10) unsigned DEFAULT NULL,
  \`new_treatment\` varchar(50) DEFAULT NULL,
  \`changed_by_id\` int(10) unsigned DEFAULT NULL,
  \`changed_by_name\` varchar(150) DEFAULT NULL,
  \`changed_by_role\` varchar(100) DEFAULT NULL,
  \`notes\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`source\` varchar(50) DEFAULT NULL,
  \`item_id\` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_tax_mapping_history');
};
