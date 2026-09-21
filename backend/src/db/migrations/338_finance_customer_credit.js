// Migration step 338 of 362
// Creates table: finance_customer_credit
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_customer_credit\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`customer_id\` int(11) NOT NULL,
  \`invoice_id\` int(11) DEFAULT NULL,
  \`original_amount\` decimal(12,2) NOT NULL,
  \`paid_amount\` decimal(12,2) DEFAULT '0.00',
  \`balance\` decimal(12,2) GENERATED ALWAYS AS ((\`original_amount\` - \`paid_amount\`)) STORED,
  \`invoice_date\` date NOT NULL,
  \`due_date\` date DEFAULT NULL,
  \`last_payment_date\` date DEFAULT NULL,
  \`status\` enum('OUTSTANDING','PAID','OVERDUE','WRITTEN_OFF') DEFAULT 'OUTSTANDING',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`customer_id\` (\`customer_id\`),
  KEY \`invoice_id\` (\`invoice_id\`),
  CONSTRAINT \`finance_customer_credit_ibfk_1\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`),
  CONSTRAINT \`finance_customer_credit_ibfk_2\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`pos_sales\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_customer_credit');
};
