// Migration step 325 of 362
// Creates table: users
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`full_name\` varchar(100) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`phone\` varchar(20) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`department_id\` int(11) NOT NULL,
  \`status_id\` int(11) NOT NULL,
  \`last_login\` datetime DEFAULT NULL,
  \`must_change_password\` tinyint(1) DEFAULT '0',
  \`two_factor_enabled\` tinyint(1) DEFAULT '0',
  \`is_employee\` tinyint(1) NOT NULL DEFAULT '0',
  \`two_factor_secret\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`deleted_at\` datetime DEFAULT NULL,
  \`created_by\` int(11) DEFAULT NULL,
  \`reset_token\` varchar(255) DEFAULT NULL,
  \`reset_token_expires\` datetime DEFAULT NULL,
  \`failed_login_attempts\` int(11) DEFAULT '0',
  \`lockout_until\` timestamp NULL DEFAULT NULL,
  \`profile_photo\` varchar(255) DEFAULT NULL,
  \`chat_enabled\` tinyint(1) DEFAULT '1',
  \`last_seen_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`),
  KEY \`idx_users_email\` (\`email\`),
  KEY \`idx_users_phone\` (\`phone\`),
  KEY \`idx_users_status\` (\`status_id\`),
  KEY \`idx_users_deleted_at\` (\`deleted_at\`),
  KEY \`department_id\` (\`department_id\`),
  KEY \`created_by\` (\`created_by\`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
