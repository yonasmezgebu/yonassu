// Migration step 346 of 362
// Creates table: hr_policy_acknowledgments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_policy_acknowledgments\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`policy_id\` int(10) unsigned DEFAULT NULL,
  \`user_id\` int(11) DEFAULT NULL,
  \`ip_address\` varchar(255) DEFAULT NULL,
  \`acknowledged_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`hr_policy_acknowledgments_policy_id_foreign\` (\`policy_id\`),
  KEY \`hr_policy_acknowledgments_user_id_foreign\` (\`user_id\`),
  CONSTRAINT \`hr_policy_acknowledgments_policy_id_foreign\` FOREIGN KEY (\`policy_id\`) REFERENCES \`hr_policies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`hr_policy_acknowledgments_user_id_foreign\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_policy_acknowledgments');
};
