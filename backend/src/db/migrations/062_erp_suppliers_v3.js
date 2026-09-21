// Migration step 62 of 362
// Creates table: erp_suppliers_v3
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`erp_suppliers_v3\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_name\` varchar(255) NOT NULL,
  \`phone\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`address\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('erp_suppliers_v3');
};
