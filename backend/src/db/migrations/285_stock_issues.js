// Migration step 285 of 362
// Creates table: stock_issues
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_issues\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`issue_no\` varchar(50) NOT NULL,
  \`department\` varchar(255) DEFAULT NULL,
  \`issued_to\` varchar(150) DEFAULT NULL,
  \`requisition_ref\` varchar(50) DEFAULT NULL,
  \`approval_ref\` varchar(50) DEFAULT NULL,
  \`issued_by\` int(10) unsigned DEFAULT NULL,
  \`issue_date\` date DEFAULT NULL,
  \`remarks\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`stock_issues_issue_no_unique\` (\`issue_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_issues');
};
