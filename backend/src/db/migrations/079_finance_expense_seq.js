// Migration step 79 of 362
// Creates table: finance_expense_seq
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_expense_seq\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`seq_date\` date NOT NULL,
  \`counter\` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_seq_date\` (\`seq_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_expense_seq');
};
