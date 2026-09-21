// Migration step 49 of 362
// Creates table: email_subscribers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`email_subscribers\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`email\` varchar(255) NOT NULL,
  \`full_name\` varchar(255) DEFAULT NULL,
  \`source\` varchar(100) DEFAULT 'landing_page',
  \`status\` enum('active','unsubscribed','bounced','spam') DEFAULT 'active',
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`user_agent\` varchar(512) DEFAULT NULL,
  \`email_verified\` tinyint(1) DEFAULT '0',
  \`verify_token\` varchar(128) DEFAULT NULL,
  \`verified_at\` timestamp NULL DEFAULT NULL,
  \`unsubscribed_at\` timestamp NULL DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`deleted_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email_subscribers_email_unique\` (\`email\`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('email_subscribers');
};
