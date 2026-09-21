// Migration step 51 of 362
// Creates table: employee_tasks
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`employee_tasks\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) NOT NULL,
  \`description\` text,
  \`assigned_to_user_id\` int(11) DEFAULT NULL,
  \`assigned_to_name\` varchar(255) DEFAULT NULL,
  \`assigned_by_name\` varchar(255) DEFAULT NULL,
  \`assigned_by_user_id\` int(11) DEFAULT NULL,
  \`department\` varchar(255) DEFAULT NULL,
  \`priority\` enum('low','medium','high') DEFAULT 'medium',
  \`status\` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  \`due_date\` date DEFAULT NULL,
  \`progress_pct\` int(11) DEFAULT '0',
  \`notes\` text,
  \`started_at\` timestamp NULL DEFAULT NULL,
  \`completed_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employee_tasks');
};
