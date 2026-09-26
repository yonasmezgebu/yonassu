// Migration step 99 of 362
// Creates table: etp_agent_installations
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE etp_agent_installations (
  agent_id varchar(20) NOT NULL,
  employee_id varchar(20) DEFAULT NULL,
  pc_name varchar(100) DEFAULT NULL,
  mac_address varchar(50) DEFAULT NULL,
  ip_address varchar(50) DEFAULT NULL,
  last_heartbeat timestamp DEFAULT NULL,
  agent_version varchar(20) DEFAULT '1.0.0',
  installation_date timestamp DEFAULT CURRENT_TIMESTAMP,
  status varchar(20) DEFAULT 'Active',
  PRIMARY KEY (agent_id),
  CONSTRAINT etp_agent_installations_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES hr_employees (employee_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS etp_agent_installations_employee_id_foreign ON etp_agent_installations (employee_id)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('etp_agent_installations');
};
