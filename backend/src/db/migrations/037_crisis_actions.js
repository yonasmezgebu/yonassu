// Migration step 37 of 362
// Creates table: crisis_actions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`crisis_actions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(200) NOT NULL,
  \`description\` text,
  \`priority\` enum('critical','high','medium','low') DEFAULT 'high',
  \`status\` enum('pending','in-progress','completed') DEFAULT 'pending',
  \`assigned_to\` varchar(100) DEFAULT NULL,
  \`deadline\` date DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('crisis_actions');
};
