exports.up = async function (knex) {
  const hasQuotationDestination = await knex.schema.hasColumn('purchase_quotations', 'destination');
  if (!hasQuotationDestination) {
    await knex.schema.alterTable('purchase_quotations', (t) => {
      t.string('destination', 20).notNullable().defaultTo('general').comment("'general' | 'pharmacy'");
    });
  }

  const itemHasCategory = await knex.schema.hasColumn('purchase_quotation_items', 'category');
  if (!itemHasCategory) {
    await knex.schema.alterTable('purchase_quotation_items', (t) => {
      t.string('category', 100).nullable();
      t.string('batch_no', 100).nullable();
      t.string('strength', 50).nullable();
      t.date('expiry_date').nullable();
    });
  }

  const hasPharmacyIncoming = await knex.schema.hasTable('pharmacy_store_incoming');
  if (!hasPharmacyIncoming) {
    await knex.schema.createTable('pharmacy_store_incoming', (t) => {
      t.increments('id').primary();
      t.integer('quotation_id').unsigned().nullable().references('id').inTable('purchase_quotations').onDelete('SET NULL');
      t.integer('purchase_order_id').unsigned().nullable();
      t.string('quotation_no', 50).nullable();
      t.string('delivery_note_no', 50).nullable();
      t.string('supplier_name', 255).nullable();
      t.string('status', 30).notNullable().defaultTo('pending');
      t.decimal('total_amount', 14, 2).notNullable().defaultTo(0);
      t.decimal('vat_rate', 5, 2).nullable().defaultTo(0);
      t.decimal('vat_amount', 14, 2).nullable().defaultTo(0);
      t.integer('created_by').unsigned().nullable();
      t.dateTime('created_at').defaultTo(knex.fn.now());
      t.dateTime('updated_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('pharmacy_store_incoming_items', (t) => {
      t.increments('id').primary();
      t.integer('incoming_id').unsigned().nullable().references('id').inTable('pharmacy_store_incoming').onDelete('CASCADE');
      t.string('item_description', 255).notNullable();
      t.string('category', 100).nullable();
      t.string('batch_no', 100).nullable();
      t.string('strength', 50).nullable();
      t.date('expiry_date').nullable();
      t.decimal('quantity', 14, 2).notNullable().defaultTo(0);
      t.string('unit', 30).nullable().defaultTo('unit');
      t.decimal('unit_price', 14, 2).notNullable().defaultTo(0);
      t.decimal('line_total', 14, 2).notNullable().defaultTo(0);
      t.string('status', 30).notNullable().defaultTo('pending');
      t.integer('received_by').unsigned().nullable();
      t.dateTime('received_at').nullable();
      t.dateTime('created_at').defaultTo(knex.fn.now());
      t.dateTime('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pharmacy_store_incoming_items');
  await knex.schema.dropTableIfExists('pharmacy_store_incoming');
  const itemHasCategory = await knex.schema.hasColumn('purchase_quotation_items', 'category');
  if (itemHasCategory) {
    await knex.schema.alterTable('purchase_quotation_items', (t) => {
      t.dropColumn('category');
      t.dropColumn('batch_no');
      t.dropColumn('strength');
      t.dropColumn('expiry_date');
    });
  }
  const hasDestination = await knex.schema.hasColumn('purchase_quotations', 'destination');
  if (hasDestination) {
    await knex.schema.alterTable('purchase_quotations', (t) => {
      t.dropColumn('destination');
    });
  }
};
