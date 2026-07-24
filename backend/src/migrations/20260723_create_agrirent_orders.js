exports.up = async (knex) => {
  await knex.schema.createTable('agrirent_orders', (t) => {
    t.increments('id').primary();
    t.string('order_number', 30).notNullable().unique();
    t.integer('tractor_id').unsigned().references('id').inTable('tractors').onDelete('SET NULL');
    t.integer('customer_id').unsigned().references('id').inTable('users').onDelete('SET NULL');

    // Customer info (stored directly for walk-ins or manual orders)
    t.string('customer_name', 120).notNullable();
    t.string('customer_phone', 30).notNullable();
    t.string('customer_email', 120).nullable();

    // Rental details
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.integer('total_days').unsigned().defaultTo(1);
    t.decimal('daily_rate', 12, 2).defaultTo(0);
    t.decimal('total_amount', 12, 2).defaultTo(0);

    // Location / field details
    t.string('field_location', 255).nullable();
    t.decimal('field_size_hectares', 8, 2).nullable();
    t.string('farming_purpose', 100).nullable(); // plowing, harvesting, seeding, etc.
    t.text('special_instructions').nullable();

    // Payment
    t.string('payment_method', 30).defaultTo('Telebirr'); // Telebirr | CBE Bank | Cash
    t.string('payment_reference', 100).nullable();
    t.enum('payment_status', ['Pending', 'Confirmed', 'Rejected']).defaultTo('Pending');
    t.text('finance_notes').nullable();
    t.integer('verified_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    t.timestamp('verified_at').nullable();

    // Order status
    t.enum('status', [
      'pending',      // just submitted
      'approved',     // manager approved
      'confirmed',    // payment verified
      'active',       // machine deployed on field
      'completed',    // work done
      'cancelled'
    ]).defaultTo('pending');

    // Manual form flag
    t.boolean('is_manual').defaultTo(false);  // true = created by manager manually
    t.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');

    t.text('manager_note').nullable();
    t.timestamp('approved_at').nullable();
    t.timestamp('cancelled_at').nullable();
    t.string('cancellation_reason', 255).nullable();

    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('agrirent_orders');
};
