// Migration step 331 of 362
// Creates table: employees
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE \`employees\` (
  \`employee_id\` varchar(20) NOT NULL,
  \`user_id\` int(11) DEFAULT NULL,
  \`full_name\` varchar(100) NOT NULL,
  \`email\` varchar(100) NOT NULL,
  \`phone\` varchar(15) DEFAULT NULL,
  \`position\` varchar(80) DEFAULT NULL,
  \`department\` enum('Printing','Pharmacy','Car Rental','Farming','Retail','Admin','IT','Finance') NOT NULL,
  \`join_date\` date DEFAULT NULL,
  \`base_salary\` decimal(12,2) DEFAULT '0.00',
  \`allowance\` decimal(12,2) DEFAULT '0.00',
  \`standing_deduction\` decimal(12,2) DEFAULT '0.00',
  \`payment_method\` enum('Cash','Bank Transfer','Telebirr') DEFAULT 'Bank Transfer',
  \`bank_account\` varchar(30) DEFAULT NULL,
  \`work_type\` enum('Office','Field') DEFAULT 'Office',
  \`status\` enum('Active','Inactive','On Leave') DEFAULT 'Active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`password_hash\` varchar(255) NOT NULL DEFAULT '',
  \`check_in_time\` time NOT NULL DEFAULT '08:30:00',
  \`check_out_time\` time NOT NULL DEFAULT '17:30:00',
  \`lunch_break_minutes\` int(11) DEFAULT '60',
  \`work_days_per_month\` int(11) DEFAULT '22',
  \`document_url\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`employee_id\`),
  UNIQUE KEY \`email\` (\`email\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`employees_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employees');
};
