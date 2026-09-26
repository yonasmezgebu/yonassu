// Migration step 109 of 362
// Creates table: hr_positions
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE hr_positions (
  position_id varchar(20) NOT NULL,
  position_title varchar(100) NOT NULL,
  position_level varchar(50) DEFAULT NULL,
  dept_id varchar(20) DEFAULT NULL,
  budgeted_salary numeric(12,2) DEFAULT NULL,
  created_date timestamp DEFAULT CURRENT_TIMESTAMP,
  status varchar(20) DEFAULT 'Active',
  PRIMARY KEY (position_id),
  CONSTRAINT hr_positions_dept_id_foreign FOREIGN KEY (dept_id) REFERENCES hr_departments (dept_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS hr_positions_dept_id_foreign ON hr_positions (dept_id)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('hr_positions');
};
