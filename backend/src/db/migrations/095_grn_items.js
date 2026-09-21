// Migration step 95 of 362
// Creates table: grn_items
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`grn_items\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`grn_id\` int(11) NOT NULL,
  \`po_item_id\` int(11) NOT NULL,
  \`quantity_ordered\` int(11) NOT NULL,
  \`quantity_received\` int(11) NOT NULL,
  \`quantity_damaged\` int(11) DEFAULT '0',
  \`quality_pass\` tinyint(1) DEFAULT '1',
  \`unit_price\` decimal(15,2) NOT NULL,
  \`total\` decimal(15,2) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('grn_items');
};
