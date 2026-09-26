// Migration step 273 of 362
// Creates table: sessions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE sessions (
  id varchar(255) NOT NULL,
  user_id integer NOT NULL,
  token varchar(512) NOT NULL,
  expires_at timestamp NOT NULL,
  ip_address varchar(45) DEFAULT NULL,
  user_agent text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS sessions_idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_idx_sessions_expires ON sessions (expires_at)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};
