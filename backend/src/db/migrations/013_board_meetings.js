// Migration step 13 of 362
// Creates table: board_meetings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE board_meetings (
  id integer NOT NULL,
  title varchar(200) NOT NULL,
  meeting_date date NOT NULL,
  meeting_time time DEFAULT NULL,
  venue varchar(200) DEFAULT NULL,
  status citext DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  agenda text,
  minutes text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('board_meetings');
};
