// Migration step 15 of 362
// Creates table: board_resolutions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE board_resolutions (
  id integer NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  meeting_id integer DEFAULT NULL,
  resolution_date date DEFAULT NULL,
  status citext DEFAULT 'proposed' CHECK (status IN ('proposed', 'passed', 'rejected', 'implemented')),
  proposed_by varchar(100) DEFAULT NULL,
  outcome text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_resolutions');
};
