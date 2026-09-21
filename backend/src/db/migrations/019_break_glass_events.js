// Migration step 19 of 362
// Creates table: break_glass_events
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`break_glass_events\` (
  \`id\` int(10) unsigned NOT NULL,
  \`activated_by\` int(10) unsigned DEFAULT NULL,
  \`reason\` text,
  \`co_approver_id\` int(10) unsigned DEFAULT NULL,
  \`activated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`deactivated_at\` timestamp NULL DEFAULT NULL,
  \`deactivated_by\` int(10) unsigned DEFAULT NULL,
  \`expires_at\` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('break_glass_events');
};
