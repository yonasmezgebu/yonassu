// Migration step 105 of 362
// Creates table: hr_employee_documents
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_employee_documents\` (
  \`doc_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`doc_type\` varchar(50) DEFAULT NULL,
  \`doc_name\` varchar(200) DEFAULT NULL,
  \`doc_path\` varchar(255) DEFAULT NULL,
  \`upload_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`uploaded_by\` varchar(50) DEFAULT NULL,
  PRIMARY KEY (\`doc_id\`),
  KEY \`hr_employee_documents_employee_id_foreign\` (\`employee_id\`),
  CONSTRAINT \`hr_employee_documents_employee_id_foreign\` FOREIGN KEY (\`employee_id\`) REFERENCES \`hr_employees\` (\`employee_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_employee_documents');
};
