// Migration step 168 of 362
// Creates table: pharmacy_targets
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_targets\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`sales_target\` decimal(15,2) DEFAULT '0.00',
  \`period\` varchar(20) DEFAULT 'ALL',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_targets');
};
