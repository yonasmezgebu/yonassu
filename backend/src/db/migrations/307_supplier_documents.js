// Migration step 307 of 362
// Creates table: supplier_documents
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`supplier_documents\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_id\` int(11) NOT NULL,
  \`document_name\` varchar(255) NOT NULL,
  \`document_type\` varchar(255) NOT NULL,
  \`file_url\` varchar(255) NOT NULL,
  \`uploaded_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('supplier_documents');
};
