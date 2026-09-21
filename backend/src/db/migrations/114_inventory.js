// Migration step 114 of 362
// Creates table: inventory
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`inventory\` (
  \`product_id\` int(11) NOT NULL,
  \`quantity\` int(11) NOT NULL DEFAULT '0',
  \`unit_cost\` decimal(15,2) NOT NULL,
  \`location\` varchar(100) DEFAULT NULL,
  \`last_updated\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`last_counted\` datetime DEFAULT NULL,
  PRIMARY KEY (\`product_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory');
};
