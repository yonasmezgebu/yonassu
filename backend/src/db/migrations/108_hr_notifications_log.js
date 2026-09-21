// Migration step 108 of 362
// Creates table: hr_notifications_log
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_notifications_log\` (
  \`notification_id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`rule_id\` varchar(20) DEFAULT NULL,
  \`employee_id\` varchar(20) DEFAULT NULL,
  \`dept_id\` varchar(20) DEFAULT NULL,
  \`notification_message\` text,
  \`priority\` varchar(20) DEFAULT 'MEDIUM',
  \`status\` varchar(20) DEFAULT 'Pending',
  \`recipient_user\` varchar(50) DEFAULT NULL,
  \`sent_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`read_date\` datetime DEFAULT NULL,
  \`acknowledge_date\` datetime DEFAULT NULL,
  \`action_taken\` text,
  PRIMARY KEY (\`notification_id\`),
  KEY \`hr_notifications_log_rule_id_foreign\` (\`rule_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_notifications_log');
};
