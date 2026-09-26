// Migration step 97 of 362
// Creates table: hr_departments
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE hr_departments (
  dept_id varchar(20) NOT NULL,
  dept_name varchar(100) NOT NULL,
  dept_code varchar(10) DEFAULT NULL,
  head_employee_id varchar(20) DEFAULT NULL,
  budget_code varchar(20) DEFAULT NULL,
  created_date timestamp DEFAULT CURRENT_TIMESTAMP,
  modified_date timestamp DEFAULT CURRENT_TIMESTAMP,
  status varchar(20) DEFAULT 'Active',
  PRIMARY KEY (dept_id)
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_departments');
};
