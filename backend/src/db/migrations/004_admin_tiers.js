// Migration step 4 of 362
// Creates table: admin_tiers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE admin_tiers (
  id integer NOT NULL,
  user_id integer DEFAULT NULL,
  tier citext NOT NULL CHECK (tier IN ('L1', 'L2', 'L3', 'L4')),
  assigned_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_tiers');
};
