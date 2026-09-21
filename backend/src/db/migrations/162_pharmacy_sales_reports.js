// Migration step 162 of 362
// Creates table: pharmacy_sales_reports
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_sales_reports\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`report_date\` date NOT NULL,
  \`total_sales\` int(11) DEFAULT '0',
  \`total_amount\` decimal(12,2) DEFAULT '0.00',
  \`status\` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  \`submitted_by\` int(10) unsigned DEFAULT NULL,
  \`submitted_at\` timestamp NULL DEFAULT NULL,
  \`finance_decision\` varchar(30) DEFAULT NULL,
  \`finance_notes\` text,
  \`finance_decided_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_sales_reports');
};
