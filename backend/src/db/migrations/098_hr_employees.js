// Migration step 98 of 362
// Creates table: hr_employees
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE hr_employees (
  employee_id varchar(20) NOT NULL,
  full_name varchar(150) NOT NULL,
  national_id varchar(50) DEFAULT NULL,
  date_of_birth date DEFAULT NULL,
  gender varchar(10) DEFAULT NULL,
  marital_status varchar(20) DEFAULT NULL,
  profile_photo_path varchar(255) DEFAULT NULL,
  personal_phone varchar(20) DEFAULT NULL,
  emergency_contact_name varchar(150) DEFAULT NULL,
  emergency_contact_phone varchar(20) DEFAULT NULL,
  personal_email varchar(100) DEFAULT NULL,
  physical_address text,
  dept_id varchar(20) DEFAULT NULL,
  unit_id varchar(20) DEFAULT NULL,
  position_id varchar(20) DEFAULT NULL,
  direct_manager_id varchar(20) DEFAULT NULL,
  hire_date date DEFAULT NULL,
  contract_end_date date DEFAULT NULL,
  employment_type varchar(20) DEFAULT 'Permanent',
  probation_end_date date DEFAULT NULL,
  base_salary numeric(12,2) DEFAULT '0.00',
  housing_allowance numeric(12,2) DEFAULT '0.00',
  transport_allowance numeric(12,2) DEFAULT '0.00',
  communication_allowance numeric(12,2) DEFAULT '0.00',
  overtime_rate numeric(5,2) DEFAULT '1.50',
  bank_name varchar(100) DEFAULT NULL,
  bank_account_number varchar(50) DEFAULT NULL,
  employment_status varchar(20) DEFAULT 'Active',
  registration_status varchar(255) NOT NULL DEFAULT 'pending_approval',
  rejection_reason text,
  termination_date date DEFAULT NULL,
  termination_reason text,
  rehire_eligible varchar(3) DEFAULT 'Yes',
  created_by varchar(50) DEFAULT NULL,
  created_date timestamp DEFAULT CURRENT_TIMESTAMP,
  last_modified_by varchar(50) DEFAULT NULL,
  last_modified_date timestamp DEFAULT CURRENT_TIMESTAMP,
  has_pc_access varchar(3) DEFAULT 'No',
  shift_start_time time DEFAULT NULL,
  shift_end_time time DEFAULT NULL,
  weekly_off_days varchar(50) DEFAULT NULL,
  user_id integer DEFAULT NULL,
  fingerprint_id varchar(100) DEFAULT NULL,
  fingerprint_enrolled_at varchar(50) DEFAULT NULL,
  fingerprint_enrolled_by varchar(150) DEFAULT NULL,
  last_web_active timestamp NULL DEFAULT NULL,
  document_path varchar(255) DEFAULT NULL,
  education_level varchar(50) DEFAULT NULL,
  institution_name varchar(150) DEFAULT NULL,
  field_of_study varchar(100) DEFAULT NULL,
  graduation_year varchar(10) DEFAULT NULL,
  id_photo_front varchar(255) DEFAULT NULL,
  id_photo_back varchar(255) DEFAULT NULL,
  payment_method varchar(50) DEFAULT 'Bank Transfer',
  overtime_payment numeric(10,2) DEFAULT '0.00',
  is_attendance_enabled boolean DEFAULT true,
  PRIMARY KEY (employee_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_bank_account_number ON hr_employees (bank_account_number);
CREATE INDEX IF NOT EXISTS hr_employees_dept_id_foreign ON hr_employees (dept_id);
CREATE INDEX IF NOT EXISTS hr_employees_unit_id_foreign ON hr_employees (unit_id);
CREATE INDEX IF NOT EXISTS hr_employees_position_id_foreign ON hr_employees (position_id)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_employees');
};
