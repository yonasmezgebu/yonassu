exports.up = function (knex) {
  return knex.schema.raw(`ALTER TABLE procurement_requests MODIFY COLUMN ceo_decision ENUM('PENDING','APPROVED','REJECTED','WAIT') NOT NULL DEFAULT 'PENDING'`);
};

exports.down = function (knex) {
  return knex.schema.raw(`ALTER TABLE procurement_requests MODIFY COLUMN ceo_decision ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING'`);
};
