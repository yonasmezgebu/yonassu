// Migration step 177 of 362
// Creates table: po_payments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`po_payments\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`po_id\` int(11) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`payment_method_id\` int(11) NOT NULL,
  \`reference_number\` varchar(100) DEFAULT NULL,
  \`status_id\` int(11) NOT NULL,
  \`processed_by\` int(11) NOT NULL,
  \`processed_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`notes\` text,
  PRIMARY KEY (\`id\`),
  KEY \`idx_po_payments_po\` (\`po_id\`),
  KEY \`idx_po_payments_status\` (\`status_id\`),
  KEY \`payment_method_id\` (\`payment_method_id\`),
  KEY \`processed_by\` (\`processed_by\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('po_payments');
};
