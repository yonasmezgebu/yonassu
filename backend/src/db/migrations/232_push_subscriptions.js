// Migration step 232 of 362
// Creates table: push_subscriptions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`push_subscriptions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`user_id\` int(10) unsigned NOT NULL,
  \`endpoint\` varchar(255) NOT NULL,
  \`p256dh_key\` varchar(255) NOT NULL,
  \`auth_key\` varchar(255) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('push_subscriptions');
};
