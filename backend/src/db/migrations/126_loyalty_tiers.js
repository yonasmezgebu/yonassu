// Migration step 126 of 362
// Creates table: loyalty_tiers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`loyalty_tiers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(50) NOT NULL,
  \`min_annual_spend\` decimal(15,2) DEFAULT '0.00',
  \`discount_percent\` decimal(5,2) DEFAULT '0.00',
  \`points_multiplier\` decimal(5,2) DEFAULT '1.00',
  \`color\` varchar(7) DEFAULT '#94a3b8',
  \`benefits\` text,
  \`sort_order\` int(11) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`loyalty_tiers_name_unique\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('loyalty_tiers');
};
