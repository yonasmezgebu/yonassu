// Migration step 40 of 362
// Creates table: customer_quotes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`customer_quotes\` (
  \`id\` varchar(255) NOT NULL,
  \`customer_id\` int(11) NOT NULL,
  \`product_type\` varchar(100) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`paper_type\` varchar(50) NOT NULL,
  \`pages_per_copy\` int(11) NOT NULL,
  \`color_printing\` tinyint(1) NOT NULL DEFAULT '0',
  \`binding_type\` varchar(50) NOT NULL,
  \`total_price\` decimal(10,2) NOT NULL,
  \`breakdown_json\` text,
  \`status\` varchar(50) NOT NULL DEFAULT 'pending',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`expires_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`customer_id\` (\`customer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customer_quotes');
};
