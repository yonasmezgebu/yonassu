// Migration step 242 of 362
// Creates table: retail_branch_products
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_branch_products\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`branch_id\` int(11) NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`quantity\` int(11) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`retail_branch_products_branch_id_product_id_unique\` (\`branch_id\`,\`product_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_branch_products');
};
