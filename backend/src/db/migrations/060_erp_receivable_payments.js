// Migration step 60 of 362
// Creates table: erp_receivable_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_receivable_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`receivable_id\` int(10) unsigned NOT NULL,
  \`payment_date\` date NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`payment_method\` varchar(255) NOT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`erp_receivable_payments_receivable_id_foreign\` (\`receivable_id\`),
  CONSTRAINT \`erp_receivable_payments_receivable_id_foreign\` FOREIGN KEY (\`receivable_id\`) REFERENCES \`erp_receivables\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_receivable_payments');
};
