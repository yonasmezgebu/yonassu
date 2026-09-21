// Migration step 256 of 362
// Creates table: rma_return_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`rma_return_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`rma_return_id\` int(10) unsigned NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`quantity\` decimal(15,2) NOT NULL,
  \`item_condition\` enum('unopened','opened','damaged','defective') DEFAULT NULL,
  \`refund_amount\` decimal(15,2) NOT NULL,
  \`reason_code\` varchar(50) DEFAULT 'customer_return',
  PRIMARY KEY (\`id\`),
  KEY \`rma_return_items_rma_return_id_foreign\` (\`rma_return_id\`),
  CONSTRAINT \`rma_return_items_rma_return_id_foreign\` FOREIGN KEY (\`rma_return_id\`) REFERENCES \`rma_returns\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('rma_return_items');
};
