// Migration step 357 of 362
// Creates table: report_submissions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`report_submissions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`report_type\` enum('income_statement','balance_sheet','bank_reconciliation') NOT NULL,
  \`period\` varchar(7) NOT NULL,
  \`financial_year\` varchar(9) DEFAULT NULL,
  \`title\` varchar(200) DEFAULT NULL,
  \`notes\` text,
  \`submitted_by\` int(11) NOT NULL,
  \`status\` enum('draft','submitted','ceo_approved','board_approved','rejected') DEFAULT 'draft',
  \`ceo_comment\` text,
  \`board_comment\` text,
  \`rejected_by\` int(11) DEFAULT NULL,
  \`rejection_reason\` text,
  \`ceo_actioned_by\` int(11) DEFAULT NULL,
  \`board_actioned_by\` int(11) DEFAULT NULL,
  \`ceo_actioned_at\` timestamp NULL DEFAULT NULL,
  \`board_actioned_at\` timestamp NULL DEFAULT NULL,
  \`rejected_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`report_submissions_submitted_by_foreign\` (\`submitted_by\`),
  KEY \`report_submissions_ceo_actioned_by_foreign\` (\`ceo_actioned_by\`),
  KEY \`report_submissions_board_actioned_by_foreign\` (\`board_actioned_by\`),
  KEY \`report_submissions_rejected_by_foreign\` (\`rejected_by\`),
  CONSTRAINT \`report_submissions_board_actioned_by_foreign\` FOREIGN KEY (\`board_actioned_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`report_submissions_ceo_actioned_by_foreign\` FOREIGN KEY (\`ceo_actioned_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`report_submissions_rejected_by_foreign\` FOREIGN KEY (\`rejected_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`report_submissions_submitted_by_foreign\` FOREIGN KEY (\`submitted_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('report_submissions');
};
