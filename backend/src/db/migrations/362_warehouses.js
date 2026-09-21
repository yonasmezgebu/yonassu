// Migration step 362 of 362
// Creates table: warehouses
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`warehouses\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`name\` varchar(150) NOT NULL,
  \`code\` varchar(50) DEFAULT NULL,
  \`address\` text,
  \`phone\` varchar(50) DEFAULT NULL,
  \`manager_name\` varchar(100) DEFAULT NULL,
  \`status\` enum('Active','Inactive') DEFAULT 'Active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`warehouses_name_unique\` (\`name\`),
  UNIQUE KEY \`warehouses_code_unique\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('warehouses');
};
