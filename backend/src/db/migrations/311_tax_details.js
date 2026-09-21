// Migration step 311 of 362
// Creates table: tax_details
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`tax_details\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned NOT NULL,
  \`tax_type\` varchar(255) NOT NULL,
  \`tax_period\` varchar(255) DEFAULT NULL,
  \`receipt_no\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`tax_details_liability_id_foreign\` (\`liability_id\`),
  CONSTRAINT \`tax_details_liability_id_foreign\` FOREIGN KEY (\`liability_id\`) REFERENCES \`liabilities\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tax_details');
};
