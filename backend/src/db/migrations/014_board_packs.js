// Migration step 14 of 362
// Creates table: board_packs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`board_packs\` (
  \`id\` int(10) unsigned NOT NULL,
  \`meeting_id\` int(11) DEFAULT NULL,
  \`title\` varchar(200) NOT NULL,
  \`document_type\` varchar(100) DEFAULT NULL,
  \`file_url\` varchar(500) DEFAULT NULL,
  \`status\` enum('draft','final','distributed') DEFAULT 'draft',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_packs');
};
