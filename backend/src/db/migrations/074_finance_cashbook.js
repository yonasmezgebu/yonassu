// Migration step 74 of 362
// Creates table: finance_cashbook
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`finance_cashbook\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`date\` date NOT NULL,
  \`type\` varchar(255) NOT NULL,
  \`reference\` varchar(255) NOT NULL,
  \`description\` varchar(255) NOT NULL,
  \`receipts\` decimal(15,2) DEFAULT '0.00',
  \`payments\` decimal(15,2) DEFAULT '0.00',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`payment_method\` varchar(255) DEFAULT NULL,
  \`is_reconciled\` tinyint(1) DEFAULT '0',
  \`reconciled_at\` timestamp NULL DEFAULT NULL,
  \`account_id\` int(10) unsigned DEFAULT NULL,
  \`account_name\` varchar(255) DEFAULT NULL,
  \`source\` varchar(255) DEFAULT NULL,
  \`received_from\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_cashbook_account\` (\`account_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('finance_cashbook');
};
