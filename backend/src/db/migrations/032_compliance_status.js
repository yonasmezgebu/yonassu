// Migration step 32 of 362
// Creates table: compliance_status
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE compliance_status (
  id integer NOT NULL,
  requirement varchar(200) NOT NULL,
  regulation varchar(100) DEFAULT NULL,
  status citext DEFAULT 'in-progress' CHECK (status IN ('compliant', 'non-compliant', 'in-progress', 'not-applicable')),
  last_review_date date DEFAULT NULL,
  next_review_date date DEFAULT NULL,
  responsible_owner varchar(100) DEFAULT NULL,
  notes text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('compliance_status');
};
