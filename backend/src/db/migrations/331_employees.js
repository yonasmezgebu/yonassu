// Migration step 331 of 362
// Creates table: employees
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE employees (
  employee_id varchar(20) NOT NULL,
  user_id integer DEFAULT NULL,
  full_name varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  phone varchar(15) DEFAULT NULL,
  position varchar(80) DEFAULT NULL,
  department citext NOT NULL CHECK (department IN ('Printing', 'Pharmacy', 'Car Rental', 'Farming', 'Retail', 'Admin', 'IT', 'Finance')),
  join_date date DEFAULT NULL,
  base_salary numeric(12,2) DEFAULT '0.00',
  allowance numeric(12,2) DEFAULT '0.00',
  standing_deduction numeric(12,2) DEFAULT '0.00',
  payment_method citext DEFAULT 'Bank Transfer' CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Telebirr')),
  bank_account varchar(30) DEFAULT NULL,
  work_type citext DEFAULT 'Office' CHECK (work_type IN ('Office', 'Field')),
  status citext DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  password_hash varchar(255) NOT NULL DEFAULT '',
  check_in_time time NOT NULL DEFAULT '08:30:00',
  check_out_time time NOT NULL DEFAULT '17:30:00',
  lunch_break_minutes integer DEFAULT '60',
  work_days_per_month integer DEFAULT '22',
  document_url varchar(255) DEFAULT NULL,
  PRIMARY KEY (employee_id),
  CONSTRAINT employees_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS employees_user_id ON employees (user_id)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employees');
};
