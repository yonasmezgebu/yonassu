// Migration step 323 of 362
// Creates table: user_roles
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE user_roles (
  user_id integer NOT NULL,
  role_id integer NOT NULL,
  branch_id integer DEFAULT NULL,
  sub_role varchar(100) DEFAULT NULL,
  assigned_at timestamp DEFAULT CURRENT_TIMESTAMP,
  assigned_by integer DEFAULT NULL,
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS user_roles_idx_user_roles_user ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS user_roles_idx_user_roles_role ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS user_roles_assigned_by ON user_roles (assigned_by)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_roles');
};
