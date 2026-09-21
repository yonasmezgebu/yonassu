// Migration step 332 of 362
// Creates table: expense_approvers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`expense_approvers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`approval_tier\` enum('manager','director','ceo') NOT NULL,
  \`min_amount\` decimal(15,2) DEFAULT '0.00',
  \`max_amount\` decimal(15,2) DEFAULT '999999999.99',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`priority\` int(11) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`expense_approvers_user_id_foreign\` (\`user_id\`),
  CONSTRAINT \`expense_approvers_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expense_approvers');
};
