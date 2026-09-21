// Migration step 67 of 362
// Creates table: erp_tax_details_v4
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_tax_details_v4\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned NOT NULL,
  \`tax_type\` varchar(255) DEFAULT NULL,
  \`tax_period\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`erp_tax_details_v4_liability_id_foreign\` (\`liability_id\`),
  CONSTRAINT \`erp_tax_details_v4_liability_id_foreign\` FOREIGN KEY (\`liability_id\`) REFERENCES \`erp_liabilities_v4\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_tax_details_v4');
};
