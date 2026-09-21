// Migration step 255 of 362
// Creates table: rma_returns
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`rma_returns\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`return_number\` varchar(50) NOT NULL,
  \`original_sale_id\` int(11) NOT NULL,
  \`customer_id\` int(11) DEFAULT NULL,
  \`condition\` enum('unopened','opened','damaged','defective') DEFAULT 'unopened',
  \`restocking_fee\` decimal(15,2) DEFAULT '0.00',
  \`refund_method\` enum('original','cash','store_credit','bank_transfer') DEFAULT 'original',
  \`total_refund\` decimal(15,2) DEFAULT '0.00',
  \`status\` enum('pending_review','approved','rejected','completed') DEFAULT 'pending_review',
  \`reason\` text,
  \`processed_by\` int(10) unsigned DEFAULT NULL,
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`inspection_notes\` text,
  \`rejection_reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`rma_returns_return_number_unique\` (\`return_number\`),
  KEY \`rma_returns_original_sale_id_foreign\` (\`original_sale_id\`),
  CONSTRAINT \`rma_returns_original_sale_id_foreign\` FOREIGN KEY (\`original_sale_id\`) REFERENCES \`pos_sales\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rma_returns');
};
