// Migration step 140 of 362
// Creates table: password_history
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`password_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`password_hash\` varchar(255) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_password_history_user\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('password_history');
};
