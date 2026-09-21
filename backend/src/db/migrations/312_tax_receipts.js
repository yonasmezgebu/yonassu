// Migration step 312 of 362
// Creates table: tax_receipts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`tax_receipts\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`serial_number\` varchar(20) NOT NULL,
  \`order_id\` int(11) NOT NULL,
  \`customer_name\` varchar(100) NOT NULL,
  \`customer_type_id\` int(11) NOT NULL,
  \`approval_amount_total\` int(11) NOT NULL,
  \`used_count\` int(11) DEFAULT '0',
  \`remaining\` int(11) NOT NULL,
  \`approved_date\` date NOT NULL,
  \`approval_document\` varchar(255) NOT NULL,
  \`printed_by\` int(11) NOT NULL,
  \`printed_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`deleted_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`serial_number\` (\`serial_number\`),
  KEY \`idx_tax_serial\` (\`serial_number\`),
  KEY \`idx_tax_order\` (\`order_id\`),
  KEY \`customer_type_id\` (\`customer_type_id\`),
  KEY \`printed_by\` (\`printed_by\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tax_receipts');
};
