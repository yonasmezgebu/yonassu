// Migration step 115 of 362
// Creates table: inventory_movements
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`inventory_movements\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`transaction_type\` varchar(50) NOT NULL,
  \`quantity_change\` int(11) NOT NULL,
  \`quantity_before\` int(11) NOT NULL,
  \`quantity_after\` int(11) NOT NULL,
  \`reference_type\` varchar(50) DEFAULT NULL,
  \`reference_id\` int(11) DEFAULT NULL,
  \`reason\` text,
  \`performed_by\` int(11) NOT NULL,
  \`approved_by\` int(11) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_movement_product\` (\`product_id\`),
  KEY \`idx_movement_type\` (\`transaction_type\`),
  KEY \`idx_movement_created\` (\`created_at\`),
  KEY \`performed_by\` (\`performed_by\`),
  KEY \`approved_by\` (\`approved_by\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_movements');
};
