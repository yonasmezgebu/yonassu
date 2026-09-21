// Migration step 150 of 362
// Creates table: pharmacy_branches
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_branches\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`status\` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`pharmacy_branches_name_unique\` (\`name\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_branches');
};
