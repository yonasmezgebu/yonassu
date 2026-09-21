// Migration step 4 of 362
// Creates table: admin_tiers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`admin_tiers\` (
  \`id\` int(10) unsigned NOT NULL,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`tier\` enum('L1','L2','L3','L4') NOT NULL,
  \`assigned_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_tiers');
};
