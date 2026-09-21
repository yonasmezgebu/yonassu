// Migration step 46 of 362
// Creates table: dr_tests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`dr_tests\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`status\` varchar(20) DEFAULT 'in_progress',
  \`notes\` text,
  \`completed_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('dr_tests');
};
