// Migration step 125 of 362
// Creates table: loyalty_rewards
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`loyalty_rewards\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`description\` text,
  \`points_required\` int(11) NOT NULL,
  \`reward_type\` varchar(50) DEFAULT 'discount',
  \`reward_value\` decimal(15,2) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('loyalty_rewards');
};
