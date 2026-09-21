// Migration step 243 of 362
// Creates table: retail_branches
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`retail_branches\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`code\` varchar(50) DEFAULT NULL,
  \`address\` text,
  \`phone\` varchar(50) DEFAULT NULL,
  \`working_hours\` varchar(100) DEFAULT NULL,
  \`manager_name\` varchar(100) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('retail_branches');
};
