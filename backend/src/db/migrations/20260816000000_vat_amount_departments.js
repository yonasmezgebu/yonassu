exports.up = async (knex) => {
  const addCol = async (table, column, builder) => {
    if (await knex.schema.hasTable(table)) {
      if (!(await knex.schema.hasColumn(table, column))) {
        await knex.schema.alterTable(table, builder);
      }
    }
  };

  // Car rental
  await addCol('rental_orders', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));
  await addCol('rental_orders', 'subtotal', (t) => t.decimal('subtotal', 14, 2).defaultTo(0));

  // Agri rental
  await addCol('agrirent_orders', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));
  await addCol('agrirent_orders', 'subtotal', (t) => t.decimal('subtotal', 14, 2).defaultTo(0));

  // Printing
  await addCol('printing_orders', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));
  await addCol('printing_orders', 'subtotal', (t) => t.decimal('subtotal', 14, 2).defaultTo(0));

  // Pharmacy (running flow)
  await addCol('pharmacy_sales', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));
  await addCol('pharmacy_sales', 'subtotal', (t) => t.decimal('subtotal', 14, 2).defaultTo(0));
  await addCol('pharmacy_sale_items', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));

  // Tender sell
  await addCol('bids', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));

  // Tender buy (drug procurement)
  await addCol('procurement_fund_requests', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));

  // Tender buy (public procurement)
  await addCol('public_fund_requests', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));
  await addCol('public_fund_request_items', 'vat_amount', (t) => t.decimal('vat_amount', 14, 2).defaultTo(0));
};

exports.down = async (knex) => {
  const dropCol = async (table, column) => {
    if (await knex.schema.hasTable(table)) {
      if (await knex.schema.hasColumn(table, column)) {
        await knex.schema.alterTable(table, (t) => t.dropColumn(column));
      }
    }
  };
  await dropCol('rental_orders', 'vat_amount');
  await dropCol('rental_orders', 'subtotal');
  await dropCol('agrirent_orders', 'vat_amount');
  await dropCol('agrirent_orders', 'subtotal');
  await dropCol('printing_orders', 'vat_amount');
  await dropCol('printing_orders', 'subtotal');
  await dropCol('pharmacy_sales', 'vat_amount');
  await dropCol('pharmacy_sales', 'subtotal');
  await dropCol('pharmacy_sale_items', 'vat_amount');
  await dropCol('bids', 'vat_amount');
  await dropCol('procurement_fund_requests', 'vat_amount');
  await dropCol('public_fund_requests', 'vat_amount');
  await dropCol('public_fund_request_items', 'vat_amount');
};
