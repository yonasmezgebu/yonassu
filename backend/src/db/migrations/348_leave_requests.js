// Migration step 348 of 362
// Creates table: leave_requests
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`leave_requests\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(20) NOT NULL,
  \`leave_type_id\` int(11) DEFAULT NULL,
  \`leave_type\` enum('Annual Leave','Sick Leave','Unpaid Leave','Emergency Leave') NOT NULL,
  \`start_date\` date NOT NULL,
  \`end_date\` date NOT NULL,
  \`total_days\` int(11) NOT NULL,
  \`reason\` text NOT NULL,
  \`status\` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  \`reviewed_by\` varchar(20) DEFAULT NULL,
  \`rejection_reason\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`employee_id\` (\`employee_id\`),
  CONSTRAINT \`leave_requests_ibfk_1\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('leave_requests');
};
