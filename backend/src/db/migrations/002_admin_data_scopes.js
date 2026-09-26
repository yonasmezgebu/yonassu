// Migration step 2 of 362
// Creates table: admin_data_scopes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE admin_data_scopes (
  id integer NOT NULL,
  admin_id integer DEFAULT NULL,
  geographic varchar(255) DEFAULT NULL,
  department varchar(255) DEFAULT NULL,
  sensitivity_limit varchar(10) DEFAULT NULL,
  time_restriction varchar(255) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT NULL
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_data_scopes');
};
