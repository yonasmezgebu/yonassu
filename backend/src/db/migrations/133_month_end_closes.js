// Migration step 133 of 362
// Creates table: month_end_closes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`month_end_closes\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`close_period\` varchar(7) NOT NULL,
  \`close_date\` date NOT NULL,
  \`status\` enum('open','closing','closed','reopened') DEFAULT 'open',
  \`closed_at\` timestamp NULL DEFAULT NULL,
  \`closed_by\` int(10) unsigned DEFAULT NULL,
  \`reopened_by\` int(10) unsigned DEFAULT NULL,
  \`reopened_at\` timestamp NULL DEFAULT NULL,
  \`checklist_results\` text,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`month_end_closes_close_period_unique\` (\`close_period\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('month_end_closes');
};
