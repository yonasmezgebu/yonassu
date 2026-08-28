exports.up = async function (knex) {
  const hasCostPrice = await knex.schema.hasColumn('sales_invoice_items', 'cost_price');
  if (!hasCostPrice) {
    await knex.schema.alterTable('sales_invoice_items', (t) => {
      t.decimal('cost_price', 15, 2).defaultTo(null).after('unit_price');
    });
  }

  const hasVatTx = await knex.schema.hasTable('vat_transactions');
  if (!hasVatTx) {
    await knex.schema.createTable('vat_transactions', (t) => {
      t.increments('id');
      t.enum('type', ['input', 'output']).notNullable();
      t.string('source', 50).notNullable();
      t.integer('source_id').unsigned().nullable();
      t.string('item_name', 255).nullable();
      t.decimal('qty', 10, 2).defaultTo(0);
      t.decimal('selling_price', 15, 2).defaultTo(0);
      t.decimal('cost_price', 15, 2).defaultTo(0);
      t.decimal('vat_rate', 5, 4).defaultTo(0);
      t.decimal('vat_amount', 15, 2).defaultTo(0);
      t.string('treatment', 30).defaultTo('standard');
      t.string('reference_no', 100).nullable();
      t.timestamps(true, true);
    });
  }
};

exports.down = async function (knex) {
  const hasVatTx = await knex.schema.hasTable('vat_transactions');
  if (hasVatTx) await knex.schema.dropTableIfExists('vat_transactions');
  const hasCostPrice = await knex.schema.hasColumn('sales_invoice_items', 'cost_price');
  if (hasCostPrice) {
    await knex.schema.alterTable('sales_invoice_items', (t) => {
      t.dropColumn('cost_price');
    });
  }
};
