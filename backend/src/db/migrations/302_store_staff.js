// Migration step 302 of 362
// Creates table: store_staff
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`store_staff\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`staff_no\` varchar(50) NOT NULL,
  \`full_name\` varchar(255) NOT NULL,
  \`role\` varchar(150) DEFAULT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`hire_date\` date DEFAULT NULL,
  \`performance\` varchar(50) DEFAULT 'Good',
  \`assigned_tasks\` int(11) DEFAULT '0',
  \`status\` enum('Active','Inactive') DEFAULT 'Active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`store_staff_staff_no_unique\` (\`staff_no\`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('store_staff');
};
