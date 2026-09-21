// Migration step 54 of 362
// Creates table: erp_liabilities
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_liabilities\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_name\` varchar(255) NOT NULL,
  \`invoice_number\` varchar(255) NOT NULL,
  \`description\` text,
  \`amount\` decimal(15,2) NOT NULL,
  \`paid_amount\` decimal(15,2) DEFAULT '0.00',
  \`balance\` decimal(15,2) NOT NULL,
  \`invoice_date\` date NOT NULL,
  \`due_date\` date NOT NULL,
  \`status\` varchar(255) DEFAULT 'Pending',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_liabilities');
};
