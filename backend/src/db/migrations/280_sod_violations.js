// Migration step 280 of 362
// Creates table: sod_violations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sod_violations\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`role_a_id\` int(10) unsigned DEFAULT NULL,
  \`role_b_id\` int(10) unsigned DEFAULT NULL,
  \`sod_rule_id\` int(10) unsigned DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'open',
  \`notes\` text,
  \`detected_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`remediated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sod_violations');
};
