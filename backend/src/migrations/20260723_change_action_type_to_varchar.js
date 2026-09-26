// Converted from MySQL to PostgreSQL.
//
// This previously only did anything when the client was `mysql`/`mysql2`, and
// silently no-opped otherwise.  Under PostgreSQL that no-op branch is the one
// that would have run, so the conversion is now unconditional.  The statement
// itself is already PostgreSQL syntax (`ALTER COLUMN ... TYPE`), which is what
// the original MySQL `MODIFY COLUMN` was translated into.
exports.up = async function (knex) {
  await knex.raw('ALTER TABLE general_movement_log ALTER COLUMN action_type TYPE varchar(50);');
};

exports.down = async function (knex) {
  await knex.raw('ALTER TABLE general_movement_log ALTER COLUMN action_type TYPE citext;');
};
