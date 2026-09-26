// Migration step 40 of 362
// Creates table: customer_quotes
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE customer_quotes (
  id varchar(255) NOT NULL,
  customer_id integer NOT NULL,
  product_type varchar(100) NOT NULL,
  quantity integer NOT NULL,
  paper_type varchar(50) NOT NULL,
  pages_per_copy integer NOT NULL,
  color_printing boolean NOT NULL DEFAULT false,
  binding_type varchar(50) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  breakdown_json text,
  status varchar(50) NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp DEFAULT NULL,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS customer_quotes_customer_id ON customer_quotes (customer_id)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customer_quotes');
};
