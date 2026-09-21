// Migration step 335 of 362
// Creates table: expense_approval_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`expense_approval_requests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`expense_id\` int(11) NOT NULL,
  \`approver_id\` int(11) DEFAULT NULL,
  \`tier\` enum('manager','director','ceo') NOT NULL,
  \`status\` enum('pending','approved','rejected','escalated','skipped') DEFAULT 'pending',
  \`comments\` text,
  \`actioned_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`expense_approval_requests_expense_id_foreign\` (\`expense_id\`),
  KEY \`expense_approval_requests_approver_id_foreign\` (\`approver_id\`),
  CONSTRAINT \`expense_approval_requests_approver_id_foreign\` FOREIGN KEY (\`approver_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`expense_approval_requests_expense_id_foreign\` FOREIGN KEY (\`expense_id\`) REFERENCES \`expenses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expense_approval_requests');
};
