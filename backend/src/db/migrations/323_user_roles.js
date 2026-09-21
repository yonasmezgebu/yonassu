// Migration step 323 of 362
// Creates table: user_roles
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`user_roles\` (
  \`user_id\` int(11) NOT NULL,
  \`role_id\` int(11) NOT NULL,
  \`branch_id\` int(10) unsigned DEFAULT NULL,
  \`sub_role\` varchar(100) DEFAULT NULL,
  \`assigned_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`assigned_by\` int(11) DEFAULT NULL,
  PRIMARY KEY (\`user_id\`,\`role_id\`),
  KEY \`idx_user_roles_user\` (\`user_id\`),
  KEY \`idx_user_roles_role\` (\`role_id\`),
  KEY \`assigned_by\` (\`assigned_by\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_roles');
};
