// Migration step 234 of 362
// Creates table: quotations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`quotations\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`quote_number\` varchar(50) NOT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`opportunity_id\` int(10) unsigned DEFAULT NULL,
  \`subtotal\` decimal(15,2) DEFAULT '0.00',
  \`tax_amount\` decimal(15,2) DEFAULT '0.00',
  \`total_amount\` decimal(15,2) DEFAULT '0.00',
  \`status\` enum('draft','sent','accepted','rejected','expired') DEFAULT 'draft',
  \`valid_until\` date DEFAULT NULL,
  \`terms_conditions\` text,
  \`notes\` text,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`approved_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`unit\` varchar(50) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`quotations_quote_number_unique\` (\`quote_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('quotations');
};
