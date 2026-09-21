// Migration step 52 of 362
// Creates table: erp_customers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_customers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`customer_name\` varchar(255) NOT NULL,
  \`phone\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`address\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_customers');
};
