// Migration step 14 of 362
// Creates table: board_packs
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE board_packs (
  id integer NOT NULL,
  meeting_id integer DEFAULT NULL,
  title varchar(200) NOT NULL,
  document_type varchar(100) DEFAULT NULL,
  file_url varchar(500) DEFAULT NULL,
  status citext DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'distributed')),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_packs');
};
