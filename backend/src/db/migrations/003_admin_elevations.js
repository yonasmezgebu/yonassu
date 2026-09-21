// Migration step 3 of 362
// Creates table: admin_elevations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`admin_elevations\` (
  \`id\` int(10) unsigned NOT NULL,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`target_tier\` varchar(10) DEFAULT NULL,
  \`duration_minutes\` int(11) DEFAULT NULL,
  \`reason\` text,
  \`ticket_ref\` varchar(255) DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'pending',
  \`approved_by\` int(10) unsigned DEFAULT NULL,
  \`approved_at\` timestamp NULL DEFAULT NULL,
  \`revoked_at\` timestamp NULL DEFAULT NULL,
  \`expires_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_elevations');
};
