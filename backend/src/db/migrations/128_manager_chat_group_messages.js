// Migration step 128 of 362
// Creates table: manager_chat_group_messages
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`manager_chat_group_messages\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`group_id\` int(10) unsigned NOT NULL,
  \`sender_user_id\` int(10) unsigned NOT NULL,
  \`message\` text,
  \`file_url\` varchar(500) DEFAULT NULL,
  \`file_name\` varchar(255) DEFAULT NULL,
  \`file_type\` varchar(100) DEFAULT NULL,
  \`deleted\` tinyint(1) DEFAULT '0',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`reply_to_id\` int(10) unsigned DEFAULT NULL,
  \`reactions\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('manager_chat_group_messages');
};
