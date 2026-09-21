// Migration step 106 of 362
// Creates table: hr_messages
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_messages\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`subject\` varchar(255) DEFAULT NULL,
  \`message\` text,
  \`is_read\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`phone\` varchar(255) DEFAULT NULL,
  \`status\` varchar(255) DEFAULT 'unread',
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_messages');
};
