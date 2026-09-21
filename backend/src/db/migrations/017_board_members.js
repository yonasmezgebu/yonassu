// Migration step 17 of 362
// Creates table: board_members
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`board_members\` (
  \`member_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`board_id\` int(10) unsigned NOT NULL,
  \`user_id\` int(10) unsigned NOT NULL,
  \`position\` varchar(100) DEFAULT NULL,
  \`joined_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`member_id\`),
  KEY \`board_members_board_id_foreign\` (\`board_id\`),
  CONSTRAINT \`board_members_board_id_foreign\` FOREIGN KEY (\`board_id\`) REFERENCES \`boards\` (\`board_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_members');
};
