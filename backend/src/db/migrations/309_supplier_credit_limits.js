// Migration step 309 of 362
// Creates table: supplier_credit_limits
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`supplier_credit_limits\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_id\` int(11) NOT NULL,
  \`credit_limit\` decimal(15,2) NOT NULL,
  \`current_utilization\` decimal(15,2) DEFAULT '0.00',
  \`currency\` varchar(3) DEFAULT 'ETB',
  \`payment_terms_days\` int(11) DEFAULT '30',
  \`interest_rate\` decimal(5,2) DEFAULT '0.00',
  \`review_date\` date DEFAULT NULL,
  \`status\` enum('active','suspended','closed') DEFAULT 'active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`supplier_credit_limits_supplier_id_foreign\` (\`supplier_id\`),
  CONSTRAINT \`supplier_credit_limits_supplier_id_foreign\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('supplier_credit_limits');
};
