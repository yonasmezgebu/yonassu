// Migration step 306 of 362
// Creates table: supplier_catalog
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`supplier_catalog\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`supplier_id\` int(11) NOT NULL,
  \`product_name\` varchar(255) NOT NULL,
  \`awarded_unit_price\` decimal(15,2) NOT NULL,
  \`currency\` varchar(255) DEFAULT 'ETB',
  \`effective_date\` date NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('supplier_catalog');
};
