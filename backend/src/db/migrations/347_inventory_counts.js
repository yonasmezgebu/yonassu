// Migration step 347 of 362
// Creates table: inventory_counts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`inventory_counts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`counted_quantity\` int(11) NOT NULL,
  \`system_quantity\` int(11) NOT NULL,
  \`variance\` int(11) NOT NULL,
  \`notes\` text,
  \`counted_by\` int(11) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`inventory_counts_product_id_foreign\` (\`product_id\`),
  KEY \`inventory_counts_counted_by_foreign\` (\`counted_by\`),
  CONSTRAINT \`inventory_counts_counted_by_foreign\` FOREIGN KEY (\`counted_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`inventory_counts_product_id_foreign\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_counts');
};
