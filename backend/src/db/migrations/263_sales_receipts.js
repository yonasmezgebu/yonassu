// Migration step 263 of 362
// Creates table: sales_receipts
exports.up = function (knex) {
  return knex.raw(`CREATE TABLE sales_receipts (
  id varchar(50) NOT NULL,
  receipt_no varchar(50) NOT NULL,
  invoice_id varchar(50) NOT NULL,
  amount_paid numeric(15,2) NOT NULL,
  payment_method varchar(50) DEFAULT NULL,
  payment_reference varchar(100) DEFAULT NULL,
  received_by_name varchar(255) DEFAULT NULL,
  status varchar(20) DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT sales_receipts_invoice_id_foreign FOREIGN KEY (invoice_id) REFERENCES sales_invoices (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS sales_receipts_receipt_no_unique ON sales_receipts (receipt_no);
CREATE INDEX IF NOT EXISTS sales_receipts_invoice_id_foreign ON sales_receipts (invoice_id)`);
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_receipts');
};
