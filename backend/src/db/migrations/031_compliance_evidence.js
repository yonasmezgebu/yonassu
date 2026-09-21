// Migration step 31 of 362
// Creates table: compliance_evidence
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`compliance_evidence\` (
  \`id\` int(10) unsigned NOT NULL,
  \`type\` varchar(255) DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'ready',
  \`period_start\` date DEFAULT NULL,
  \`period_end\` date DEFAULT NULL,
  \`file_path\` varchar(255) DEFAULT NULL,
  \`generated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('compliance_evidence');
};
