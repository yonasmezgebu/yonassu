// Migration step 122 of 362
// Creates table: liabilities
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`liabilities\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_type\` varchar(255) NOT NULL,
  \`reference_no\` varchar(255) NOT NULL,
  \`party_name\` varchar(255) NOT NULL,
  \`description\` text,
  \`amount\` decimal(15,2) NOT NULL,
  \`paid_amount\` decimal(15,2) DEFAULT '0.00',
  \`balance\` decimal(15,2) NOT NULL,
  \`issue_date\` date DEFAULT NULL,
  \`due_date\` date NOT NULL,
  \`status\` varchar(255) DEFAULT 'Pending',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('liabilities');
};
