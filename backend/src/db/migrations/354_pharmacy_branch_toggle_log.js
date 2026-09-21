// Migration step 354 of 362
// Creates table: pharmacy_branch_toggle_log
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_branch_toggle_log\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`action\` enum('ACTIVE','INACTIVE') NOT NULL,
  \`toggled_by\` int(11) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_branch_toggle_log_branch_id_foreign\` (\`branch_id\`),
  KEY \`pharmacy_branch_toggle_log_toggled_by_foreign\` (\`toggled_by\`),
  CONSTRAINT \`pharmacy_branch_toggle_log_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`pharmacy_branches\` (\`id\`),
  CONSTRAINT \`pharmacy_branch_toggle_log_toggled_by_foreign\` FOREIGN KEY (\`toggled_by\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_branch_toggle_log');
};
