// Migration step 266 of 362
// Creates table: sales_targets
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sales_targets\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`business_unit_id\` int(10) unsigned DEFAULT NULL,
  \`target_date\` date NOT NULL,
  \`period\` enum('daily','weekly','monthly','quarterly','yearly') NOT NULL,
  \`target_amount\` decimal(15,2) NOT NULL,
  \`achieved_amount\` decimal(15,2) DEFAULT '0.00',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_targets');
};
