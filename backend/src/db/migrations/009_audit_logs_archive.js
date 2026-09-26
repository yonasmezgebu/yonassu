// Migration step 9 of 362
// Creates table: audit_logs_archive
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE audit_logs_archive (
  id bigint NOT NULL,
  user_id integer NOT NULL,
  action varchar(50) NOT NULL,
  resource varchar(100) NOT NULL,
  resource_id varchar(255) DEFAULT NULL,
  department varchar(50) DEFAULT NULL,
  before_state jsonb DEFAULT NULL,
  after_state jsonb DEFAULT NULL,
  ip_address varchar(45) NOT NULL,
  user_agent text,
  status varchar(20) DEFAULT 'success',
  error_message text,
  created_at timestamp DEFAULT NULL,
  PRIMARY KEY (id)
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs_archive');
};
