// Migration step 182 of 362
// Creates table: pos_return_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pos_return_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`return_id\` int(10) unsigned NOT NULL,
  \`product_id\` int(10) unsigned DEFAULT NULL,
  \`product_name\` varchar(255) DEFAULT NULL,
  \`quantity\` int(10) unsigned NOT NULL,
  \`unit_price\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`refund_amount\` decimal(14,2) NOT NULL DEFAULT '0.00',
  \`reason_code\` varchar(100) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`pos_return_items_return_id_foreign\` (\`return_id\`),
  CONSTRAINT \`pos_return_items_return_id_foreign\` FOREIGN KEY (\`return_id\`) REFERENCES \`pos_returns\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pos_return_items');
};
