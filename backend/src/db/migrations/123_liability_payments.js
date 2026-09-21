// Migration step 123 of 362
// Creates table: liability_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`liability_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned NOT NULL,
  \`payment_date\` date NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`payment_method\` varchar(255) NOT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`liability_payments_liability_id_foreign\` (\`liability_id\`),
  CONSTRAINT \`liability_payments_liability_id_foreign\` FOREIGN KEY (\`liability_id\`) REFERENCES \`liabilities\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('liability_payments');
};
