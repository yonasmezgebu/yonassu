// Migration step 236 of 362
// Creates table: registered_computers
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`registered_computers\` (
  \`computer_id\` varchar(10) NOT NULL,
  \`computer_name\` varchar(60) NOT NULL,
  \`location\` varchar(80) DEFAULT NULL,
  \`department\` varchar(40) DEFAULT NULL,
  \`mac_address\` varchar(17) DEFAULT NULL,
  \`ip_range\` varchar(20) DEFAULT NULL,
  \`status\` enum('Active','Inactive') DEFAULT 'Active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`ip_address\` varchar(45) DEFAULT NULL,
  \`added_by_hr_id\` varchar(20) DEFAULT NULL,
  PRIMARY KEY (\`computer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('registered_computers');
};
