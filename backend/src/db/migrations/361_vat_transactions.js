// Migration step 361 of 362
// Creates table: vat_transactions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`vat_transactions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`type\` enum('input','output') NOT NULL,
  \`source\` varchar(50) NOT NULL,
  \`source_id\` int(10) unsigned DEFAULT NULL,
  \`item_name\` varchar(255) DEFAULT NULL,
  \`qty\` decimal(10,2) DEFAULT '0.00',
  \`selling_price\` decimal(15,2) DEFAULT '0.00',
  \`cost_price\` decimal(15,2) DEFAULT '0.00',
  \`vat_rate\` decimal(5,4) DEFAULT '0.0000',
  \`vat_amount\` decimal(15,2) DEFAULT '0.00',
  \`treatment\` varchar(30) DEFAULT 'standard',
  \`reference_no\` varchar(100) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vat_transactions');
};
