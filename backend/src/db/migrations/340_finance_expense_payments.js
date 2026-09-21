// Migration step 340 of 362
// Creates table: finance_expense_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_expense_payments\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`expense_id\` int(11) NOT NULL,
  \`amount\` decimal(12,2) NOT NULL,
  \`payment_method\` varchar(50) NOT NULL,
  \`reference_number\` varchar(100) DEFAULT NULL,
  \`paid_by\` int(11) NOT NULL,
  \`paid_at\` datetime NOT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`expense_id\` (\`expense_id\`),
  KEY \`paid_by\` (\`paid_by\`),
  CONSTRAINT \`finance_expense_payments_ibfk_1\` FOREIGN KEY (\`expense_id\`) REFERENCES \`finance_expenses\` (\`id\`),
  CONSTRAINT \`finance_expense_payments_ibfk_2\` FOREIGN KEY (\`paid_by\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_expense_payments');
};
