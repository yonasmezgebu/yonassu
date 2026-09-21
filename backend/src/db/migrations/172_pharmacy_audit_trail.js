// Migration step 172 of 362
// Creates table: pharmacy_audit_trail
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_audit_trail\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`worker_id\` int(10) unsigned DEFAULT NULL,
  \`action\` varchar(30) DEFAULT NULL COMMENT 'PAID / CASHOUT',
  \`recipient\` varchar(200) DEFAULT NULL,
  \`amount\` decimal(12,2) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`pharmacy_audit_trail_branch_id_foreign\` (\`branch_id\`),
  KEY \`pharmacy_audit_trail_worker_id_foreign\` (\`worker_id\`),
  CONSTRAINT \`pharmacy_audit_trail_branch_id_foreign\` FOREIGN KEY (\`branch_id\`) REFERENCES \`pharmacy_branches\` (\`id\`),
  CONSTRAINT \`pharmacy_audit_trail_worker_id_foreign\` FOREIGN KEY (\`worker_id\`) REFERENCES \`pharmacy_workers\` (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_audit_trail');
};
