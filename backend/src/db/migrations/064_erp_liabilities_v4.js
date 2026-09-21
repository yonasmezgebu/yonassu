// Migration step 64 of 362
// Creates table: erp_liabilities_v4
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_liabilities_v4\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_type\` varchar(255) NOT NULL,
  \`reference_no\` varchar(255) NOT NULL,
  \`party_id\` int(10) unsigned DEFAULT NULL,
  \`party_name\` varchar(255) DEFAULT NULL,
  \`description\` text,
  \`amount\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`paid_amount\` decimal(15,2) DEFAULT '0.00',
  \`balance\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`issue_date\` date DEFAULT NULL,
  \`due_date\` date DEFAULT NULL,
  \`status\` varchar(255) DEFAULT 'Pending',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`erp_liabilities_v4_party_id_foreign\` (\`party_id\`),
  CONSTRAINT \`erp_liabilities_v4_party_id_foreign\` FOREIGN KEY (\`party_id\`) REFERENCES \`erp_suppliers_v4\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_liabilities_v4');
};
