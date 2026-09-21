// Migration step 57 of 362
// Creates table: erp_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_payments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`liability_id\` int(10) unsigned NOT NULL,
  \`payment_date\` date NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`payment_method\` varchar(255) NOT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_payments');
};
