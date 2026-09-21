// Migration step 111 of 362
// Creates table: hr_units
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`hr_units\` (
  \`unit_id\` varchar(20) NOT NULL,
  \`unit_name\` varchar(100) NOT NULL,
  \`dept_id\` varchar(20) DEFAULT NULL,
  \`unit_head_id\` varchar(20) DEFAULT NULL,
  \`created_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`status\` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (\`unit_id\`),
  KEY \`hr_units_dept_id_foreign\` (\`dept_id\`),
  CONSTRAINT \`hr_units_dept_id_foreign\` FOREIGN KEY (\`dept_id\`) REFERENCES \`hr_departments\` (\`dept_id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_units');
};
