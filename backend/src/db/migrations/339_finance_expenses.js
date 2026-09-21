// Migration step 339 of 362
// Creates table: finance_expenses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_expenses\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`expense_number\` varchar(30) NOT NULL,
  \`category_id\` int(11) NOT NULL,
  \`department_id\` int(11) NOT NULL,
  \`amount\` decimal(12,2) NOT NULL,
  \`expense_date\` date NOT NULL,
  \`description\` text NOT NULL,
  \`notes\` text,
  \`status\` enum('DRAFT','PENDING_CEO_APPROVAL','APPROVED','REJECTED','NEEDS_INFO','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  \`submitted_by\` int(11) DEFAULT NULL,
  \`reviewed_by\` int(11) DEFAULT NULL,
  \`reviewed_at\` datetime DEFAULT NULL,
  \`review_notes\` text,
  \`rejection_reason\` text,
  \`paid_by\` int(11) DEFAULT NULL,
  \`paid_at\` datetime DEFAULT NULL,
  \`payment_method_id\` int(11) DEFAULT NULL,
  \`reference_number\` varchar(100) DEFAULT NULL,
  \`receipt_path\` varchar(500) DEFAULT NULL,
  \`cancelled_by\` int(11) DEFAULT NULL,
  \`cancelled_at\` datetime DEFAULT NULL,
  \`cancel_reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`expense_number\` (\`expense_number\`),
  KEY \`category_id\` (\`category_id\`),
  KEY \`department_id\` (\`department_id\`),
  KEY \`submitted_by\` (\`submitted_by\`),
  KEY \`reviewed_by\` (\`reviewed_by\`),
  KEY \`paid_by\` (\`paid_by\`),
  CONSTRAINT \`finance_expenses_ibfk_1\` FOREIGN KEY (\`category_id\`) REFERENCES \`finance_expense_categories\` (\`id\`),
  CONSTRAINT \`finance_expenses_ibfk_2\` FOREIGN KEY (\`department_id\`) REFERENCES \`finance_departments\` (\`id\`),
  CONSTRAINT \`finance_expenses_ibfk_3\` FOREIGN KEY (\`submitted_by\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`finance_expenses_ibfk_4\` FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`finance_expenses_ibfk_5\` FOREIGN KEY (\`paid_by\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_expenses');
};
