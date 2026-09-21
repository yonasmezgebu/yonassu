// Migration step 16 of 362
// Creates table: boards
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`boards\` (
  \`board_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`board_name\` varchar(100) NOT NULL,
  \`role\` varchar(50) DEFAULT 'Governance',
  \`description\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`board_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('boards');
};
