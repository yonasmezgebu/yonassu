// Migration step 96 of 362
// Creates table: hr_deductions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_deductions\` (
  \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(50) NOT NULL,
  \`type\` varchar(50) NOT NULL DEFAULT 'Tax/PAYE',
  \`amount\` decimal(12,2) NOT NULL,
  \`amount_type\` varchar(20) NOT NULL DEFAULT 'Fixed',
  \`percentage\` decimal(8,4) DEFAULT NULL,
  \`frequency\` varchar(20) DEFAULT 'Monthly',
  \`start_date\` date NOT NULL,
  \`end_date\` date DEFAULT NULL,
  \`description\` text,
  \`status\` varchar(20) DEFAULT 'Active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_deductions');
};
