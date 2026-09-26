// Migration step 3 of 362
// Creates table: admin_elevations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE admin_elevations (
  id integer NOT NULL,
  user_id integer DEFAULT NULL,
  target_tier varchar(10) DEFAULT NULL,
  duration_minutes integer DEFAULT NULL,
  reason text,
  ticket_ref varchar(255) DEFAULT NULL,
  status varchar(20) DEFAULT 'pending',
  approved_by integer DEFAULT NULL,
  approved_at timestamp NULL DEFAULT NULL,
  revoked_at timestamp NULL DEFAULT NULL,
  expires_at timestamp NULL DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT NULL
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_elevations');
};
