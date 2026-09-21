// Migration step 169 of 362
// Creates table: pharmacy_tasks
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`pharmacy_tasks\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`assigned_to\` int(10) unsigned DEFAULT NULL,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`task_type\` varchar(100) NOT NULL,
  \`priority\` varchar(20) DEFAULT 'Medium',
  \`deadline\` datetime DEFAULT NULL,
  \`status\` varchar(50) DEFAULT 'Pending',
  \`instructions\` text,
  \`created_by\` int(10) unsigned DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pharmacy_tasks');
};
