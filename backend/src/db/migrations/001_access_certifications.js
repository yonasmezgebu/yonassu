// Migration step 1 of 362
// Creates table: access_certifications
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`access_certifications\` (
  \`id\` int(10) unsigned NOT NULL,
  \`type\` varchar(50) DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'in_progress',
  \`owner_id\` int(10) unsigned DEFAULT NULL,
  \`due_date\` date DEFAULT NULL,
  \`completed_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('access_certifications');
};
