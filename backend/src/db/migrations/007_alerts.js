// Migration step 7 of 362
// Creates table: alerts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE alerts (
  id varchar(36) NOT NULL,
  type citext NOT NULL CHECK (type IN ('CRITICAL', 'WARNING', 'INFO')),
  module varchar(50) NOT NULL,
  title varchar(200) NOT NULL,
  message text NOT NULL,
  priority integer NOT NULL DEFAULT '5',
  target_user_id integer DEFAULT NULL,
  target_role varchar(100) DEFAULT NULL,
  status citext NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'RESOLVED')),
  related_record_id varchar(100) DEFAULT NULL,
  related_module varchar(50) DEFAULT NULL,
  fingerprint varchar(200) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS alerts_fingerprint_unique ON alerts (fingerprint)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('alerts');
};
