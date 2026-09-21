// Migration step 78 of 362
// Creates table: finance_expense_categories
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_expense_categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`description\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_expense_categories');
};
