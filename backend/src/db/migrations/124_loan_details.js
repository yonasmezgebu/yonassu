// Migration step 124 of 362
// Creates table: loan_details
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`loan_details\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned NOT NULL,
  \`lender_name\` varchar(255) NOT NULL,
  \`interest_rate\` decimal(5,2) DEFAULT NULL,
  \`term_months\` int(11) DEFAULT NULL,
  \`principal_amount\` decimal(15,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`loan_details_liability_id_foreign\` (\`liability_id\`),
  CONSTRAINT \`loan_details_liability_id_foreign\` FOREIGN KEY (\`liability_id\`) REFERENCES \`liabilities\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('loan_details');
};
