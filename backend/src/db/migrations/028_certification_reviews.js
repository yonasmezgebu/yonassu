// Migration step 28 of 362
// Creates table: certification_reviews
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE certification_reviews (
  id integer NOT NULL,
  certification_id integer DEFAULT NULL,
  user_id integer DEFAULT NULL,
  action varchar(20) DEFAULT NULL,
  notes text,
  reviewed_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('certification_reviews');
};
