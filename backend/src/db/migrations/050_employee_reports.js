// Migration step 50 of 362
// Creates table: employee_reports
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`employee_reports\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` int(10) unsigned DEFAULT NULL,
  \`employee_name\` varchar(255) DEFAULT NULL,
  \`department\` varchar(255) DEFAULT NULL,
  \`report_text\` text,
  \`document_url\` varchar(255) DEFAULT NULL,
  \`document_name\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employee_reports');
};
