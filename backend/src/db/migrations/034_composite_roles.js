// Migration step 34 of 362
// Creates table: composite_roles
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE composite_roles (
  id integer NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT NULL
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('composite_roles');
};
