// Migration step 107 of 362
// Creates table: hr_notification_rules
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_notification_rules\` (
  \`rule_id\` varchar(20) NOT NULL,
  \`rule_name\` varchar(100) DEFAULT NULL,
  \`trigger_condition\` text,
  \`priority\` varchar(20) DEFAULT 'MEDIUM',
  \`recipient_roles\` varchar(100) DEFAULT NULL,
  \`action_type\` varchar(50) DEFAULT 'Alert',
  \`is_active\` varchar(3) DEFAULT 'Yes',
  \`created_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`rule_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_notification_rules');
};
