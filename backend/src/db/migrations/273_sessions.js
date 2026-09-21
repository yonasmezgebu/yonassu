// Migration step 273 of 362
// Creates table: sessions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`sessions\` (
  \`id\` varchar(255) NOT NULL,
  \`user_id\` int(11) NOT NULL,
  \`token\` varchar(512) NOT NULL,
  \`expires_at\` datetime NOT NULL,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`user_agent\` text,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_sessions_user\` (\`user_id\`),
  KEY \`idx_sessions_expires\` (\`expires_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};
