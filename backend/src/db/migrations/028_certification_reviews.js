// Migration step 28 of 362
// Creates table: certification_reviews
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`certification_reviews\` (
  \`id\` int(10) unsigned NOT NULL,
  \`certification_id\` int(10) unsigned DEFAULT NULL,
  \`user_id\` int(10) unsigned DEFAULT NULL,
  \`action\` varchar(20) DEFAULT NULL,
  \`notes\` text,
  \`reviewed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('certification_reviews');
};
