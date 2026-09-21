// Migration step 283 of 362
// Creates table: stock_counts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`stock_counts\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`count_no\` varchar(50) NOT NULL,
  \`count_type\` varchar(50) DEFAULT NULL,
  \`count_date\` date DEFAULT NULL,
  \`counted_by\` int(10) unsigned DEFAULT NULL,
  \`verified_by\` int(10) unsigned DEFAULT NULL,
  \`remarks\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`status\` enum('PENDING','APPROVED','REJECTED','Draft','In Progress','Pending Verification','Verified','Closed') DEFAULT 'PENDING',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`stock_counts_count_no_unique\` (\`count_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_counts');
};
