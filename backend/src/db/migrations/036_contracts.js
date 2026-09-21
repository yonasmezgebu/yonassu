// Migration step 36 of 362
// Creates table: contracts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`contracts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`contract_number\` varchar(50) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`supplier_id\` int(10) unsigned NOT NULL,
  \`type\` enum('quantity','value','service','framework') NOT NULL DEFAULT 'quantity',
  \`total_value\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`consumed_value\` decimal(15,2) NOT NULL DEFAULT '0.00',
  \`start_date\` date NOT NULL,
  \`expiry_date\` date NOT NULL,
  \`status\` enum('draft','active','full','expired','cancelled') NOT NULL DEFAULT 'draft',
  \`notes\` text,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`deleted_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`contracts_contract_number_unique\` (\`contract_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('contracts');
};
