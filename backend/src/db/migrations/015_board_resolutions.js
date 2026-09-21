// Migration step 15 of 362
// Creates table: board_resolutions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`board_resolutions\` (
  \`id\` int(10) unsigned NOT NULL,
  \`title\` varchar(200) NOT NULL,
  \`description\` text,
  \`meeting_id\` int(10) unsigned DEFAULT NULL,
  \`resolution_date\` date DEFAULT NULL,
  \`status\` enum('proposed','passed','rejected','implemented') DEFAULT 'proposed',
  \`proposed_by\` varchar(100) DEFAULT NULL,
  \`outcome\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_resolutions');
};
