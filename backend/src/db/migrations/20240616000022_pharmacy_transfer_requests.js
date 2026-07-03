exports.up = async function (knex) {
  const dbName = knex.client.database();

  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  if (!(await tableExists('pharmacy_transfer_requests'))) {
    await knex.schema.createTable('pharmacy_transfer_requests', (t) => {
      t.increments('id');
      t.string('request_number', 30).notNullable().unique();
      t.integer('drug_id').notNullable();
      t.string('drug_name', 255).notNullable();
      t.integer('quantity_requested').notNullable();
      t.enum('urgency', ['LOW', 'MEDIUM', 'HIGH']).defaultTo('MEDIUM');
      t.enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'COMPLETED', 'CANCELLED']).defaultTo('PENDING');
      t.integer('store_qty_before');
      t.integer('pharmacy_qty_before');
      t.integer('pharmacy_reorder_level');
      t.decimal('store_unit_price', 15, 2);
      t.decimal('pharmacy_unit_price', 15, 2);
      t.text('rejection_reason');
      t.text('notes');
      t.integer('created_by').notNullable();
      t.integer('approved_by');
      t.integer('rejected_by');
      t.integer('shipped_by');
      t.integer('received_by');
      t.string('shipment_number', 30);
      t.integer('quantity_shipped');
      t.timestamp('shipped_at');
      t.timestamp('received_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pharmacy_transfer_requests');
};
