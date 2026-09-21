// Migration step 38 of 362
// Creates table: crisis_fast_track
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`crisis_fast_track\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`request_title\` varchar(200) NOT NULL,
  \`description\` text,
  \`amount\` decimal(14,2) DEFAULT NULL,
  \`requested_by\` varchar(100) DEFAULT NULL,
  \`status\` enum('pending','approved','rejected') DEFAULT 'pending',
  \`approved_by\` varchar(100) DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('crisis_fast_track');
};
