// Migration step 164 of 362
// Creates table: pharmacy_report_branches
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_report_branches\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`report_id\` int(10) unsigned DEFAULT NULL,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`total_sales\` int(11) DEFAULT '0',
  \`total_amount\` decimal(12,2) DEFAULT '0.00',
  \`worker_count\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_report_branches_report_id_foreign\` (\`report_id\`),
  KEY \`pharmacy_report_branches_branch_id_foreign\` (\`branch_id\`),
  CONSTRAINT \`pharmacy_report_branches_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`pharmacy_branches\` (\`id\`),
  CONSTRAINT \`pharmacy_report_branches_report_id_foreign\` FOREIGN KEY (\`report_id\`) REFERENCES \`pharmacy_sales_reports\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_report_branches');
};
