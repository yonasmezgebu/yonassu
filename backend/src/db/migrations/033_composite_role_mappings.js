// Migration step 33 of 362
// Creates table: composite_role_mappings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE composite_role_mappings (
  id integer NOT NULL,
  composite_role_id integer DEFAULT NULL,
  single_role_id integer DEFAULT NULL
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('composite_role_mappings');
};
