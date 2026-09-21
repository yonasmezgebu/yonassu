// Migration step 127 of 362
// Creates table: manager_chat_group_members
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`manager_chat_group_members\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`group_id\` int(10) unsigned NOT NULL,
  \`user_id\` int(10) unsigned NOT NULL,
  \`is_banned\` tinyint(1) DEFAULT '0',
  \`joined_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`manager_chat_group_members_group_id_user_id_unique\` (\`group_id\`,\`user_id\`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('manager_chat_group_members');
};
