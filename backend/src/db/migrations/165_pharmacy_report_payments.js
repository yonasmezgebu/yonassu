// Migration step 165 of 362
// Creates table: pharmacy_report_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_report_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`report_id\` int(10) unsigned DEFAULT NULL,
  \`payment_type\` varchar(50) DEFAULT NULL,
  \`count\` int(11) DEFAULT '0',
  \`total_amount\` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_report_payments_report_id_foreign\` (\`report_id\`),
  CONSTRAINT \`pharmacy_report_payments_report_id_foreign\` FOREIGN KEY (\`report_id\`) REFERENCES \`pharmacy_sales_reports\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_report_payments');
};
