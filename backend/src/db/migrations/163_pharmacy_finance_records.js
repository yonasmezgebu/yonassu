// Migration step 163 of 362
// Creates table: pharmacy_finance_records
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_finance_records\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`report_id\` int(10) unsigned DEFAULT NULL,
  \`revenue\` decimal(12,2) DEFAULT '0.00',
  \`cogs\` decimal(12,2) DEFAULT '0.00',
  \`profit_loss\` decimal(12,2) DEFAULT '0.00',
  \`result\` enum('PROFIT','LOSS') DEFAULT NULL,
  \`income_recorded\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pharmacy_finance_records_report_id_unique\` (\`report_id\`),
  CONSTRAINT \`pharmacy_finance_records_report_id_foreign\` FOREIGN KEY (\`report_id\`) REFERENCES \`pharmacy_sales_reports\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_finance_records');
};
