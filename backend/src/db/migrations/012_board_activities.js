// Migration step 12 of 362
// Creates table: board_activities
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`board_activities\` (
  \`activity_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`board_id\` int(10) unsigned NOT NULL,
  \`activity_type\` varchar(100) DEFAULT NULL,
  \`details\` text,
  \`activity_date\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`activity_id\`),
  KEY \`board_activities_board_id_index\` (\`board_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_activities');
};
