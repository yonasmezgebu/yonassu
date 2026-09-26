// Migration step 114 of 362
// Creates table: inventory
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE inventory (
  product_id integer NOT NULL,
  quantity integer NOT NULL DEFAULT '0',
  unit_cost numeric(15,2) NOT NULL,
  location varchar(100) DEFAULT NULL,
  last_updated timestamp DEFAULT CURRENT_TIMESTAMP,
  last_counted timestamp DEFAULT NULL,
  PRIMARY KEY (product_id)
)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory');
};
