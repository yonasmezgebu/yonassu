// Migration step 171 of 362
// Creates table: pharmacy_workers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_workers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(150) NOT NULL,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`post_permission\` tinyint(1) DEFAULT '0',
  \`phone\` varchar(30) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_workers_branch_id_foreign\` (\`branch_id\`),
  CONSTRAINT \`pharmacy_workers_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`pharmacy_branches\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_workers');
};
