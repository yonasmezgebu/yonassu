// Migration step 13 of 362
// Creates table: board_meetings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`board_meetings\` (
  \`id\` int(10) unsigned NOT NULL,
  \`title\` varchar(200) NOT NULL,
  \`meeting_date\` date NOT NULL,
  \`meeting_time\` time DEFAULT NULL,
  \`venue\` varchar(200) DEFAULT NULL,
  \`status\` enum('scheduled','in-progress','completed','cancelled') DEFAULT 'scheduled',
  \`agenda\` text,
  \`minutes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_meetings');
};
