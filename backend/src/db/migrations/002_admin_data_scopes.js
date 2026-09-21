// Migration step 2 of 362
// Creates table: admin_data_scopes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`admin_data_scopes\` (
  \`id\` int(10) unsigned NOT NULL,
  \`admin_id\` int(10) unsigned DEFAULT NULL,
  \`geographic\` varchar(255) DEFAULT NULL,
  \`department\` varchar(255) DEFAULT NULL,
  \`sensitivity_limit\` varchar(10) DEFAULT NULL,
  \`time_restriction\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('admin_data_scopes');
};
