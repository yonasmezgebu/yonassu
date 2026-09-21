// Migration step 65 of 362
// Creates table: erp_loan_details_v4
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_loan_details_v4\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned NOT NULL,
  \`lender_name\` varchar(255) DEFAULT NULL,
  \`interest_rate\` varchar(255) DEFAULT NULL,
  \`term_months\` int(11) DEFAULT NULL,
  \`principal_amount\` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`erp_loan_details_v4_liability_id_foreign\` (\`liability_id\`),
  CONSTRAINT \`erp_loan_details_v4_liability_id_foreign\` FOREIGN KEY (\`liability_id\`) REFERENCES \`erp_liabilities_v4\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_loan_details_v4');
};
