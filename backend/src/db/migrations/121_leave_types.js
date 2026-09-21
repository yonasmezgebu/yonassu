// Migration step 121 of 362
// Creates table: leave_types
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`leave_types\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(40) NOT NULL,
  \`is_paid\` tinyint(1) DEFAULT '1',
  \`max_days_per_year\` int(11) DEFAULT '15',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('leave_types');
};
