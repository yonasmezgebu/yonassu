// Migration step 130 of 362
// Creates table: manager_chats
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`manager_chats\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`sender_user_id\` int(10) unsigned NOT NULL,
  \`receiver_user_id\` int(10) unsigned NOT NULL,
  \`message\` text NOT NULL,
  \`deleted_by_sender\` tinyint(1) DEFAULT '0',
  \`deleted_by_receiver\` tinyint(1) DEFAULT '0',
  \`seen_at\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`file_url\` varchar(500) DEFAULT NULL,
  \`file_name\` varchar(255) DEFAULT NULL,
  \`file_type\` varchar(100) DEFAULT NULL,
  \`reply_to_id\` int(10) unsigned DEFAULT NULL,
  \`reactions\` text,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('manager_chats');
};
