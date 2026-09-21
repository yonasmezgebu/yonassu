// Migration step 33 of 362
// Creates table: composite_role_mappings
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`composite_role_mappings\` (
  \`id\` int(10) unsigned NOT NULL,
  \`composite_role_id\` int(10) unsigned DEFAULT NULL,
  \`single_role_id\` int(10) unsigned DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('composite_role_mappings');
};
