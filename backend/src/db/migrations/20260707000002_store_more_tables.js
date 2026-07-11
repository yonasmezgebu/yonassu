exports.up = async function (knex) {
  // ============================================================
  // 1. store_suppliers
  // ============================================================
  if (!(await knex.schema.hasTable('store_suppliers'))) {
    await knex.schema.createTable('store_suppliers', (t) => {
      t.increments('id').primary();
      t.string('supplier_no', 50).notNullable().unique();
      t.string('name', 255).notNullable();
      t.string('contact_person', 150).nullable();
      t.string('phone', 50).nullable();
      t.string('email', 255).nullable();
      t.text('address').nullable();
      t.string('tax_id', 100).nullable();
      t.string('payment_terms', 50).defaultTo('Net 30');
      t.enum('status', ['Active', 'Inactive']).defaultTo('Active');
      t.integer('delivery_count').defaultTo(0);
      t.decimal('balance', 12, 2).defaultTo(0);
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 2. store_deliveries
  // ============================================================
  if (!(await knex.schema.hasTable('store_deliveries'))) {
    await knex.schema.createTable('store_deliveries', (t) => {
      t.increments('id').primary();
      t.string('delivery_no', 50).notNullable().unique();
      t.string('supplier_name', 255).nullable();
      t.text('items_description').nullable();
      t.string('quantity_summary', 100).nullable();
      t.date('delivery_date').nullable();
      t.string('po_reference', 100).nullable();
      t.enum('status', ['Pending', 'In Transit', 'Received', 'Rejected']).defaultTo('Pending');
      t.text('rejection_reason').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 3. store_staff
  // ============================================================
  if (!(await knex.schema.hasTable('store_staff'))) {
    await knex.schema.createTable('store_staff', (t) => {
      t.increments('id').primary();
      t.string('staff_no', 50).notNullable().unique();
      t.string('full_name', 255).notNullable();
      t.string('role', 150).nullable();
      t.string('phone', 50).nullable();
      t.date('hire_date').nullable();
      t.string('performance', 50).defaultTo('Good');
      t.integer('assigned_tasks').defaultTo(0);
      t.enum('status', ['Active', 'Inactive']).defaultTo('Active');
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 4. store_attendance
  // ============================================================
  if (!(await knex.schema.hasTable('store_attendance'))) {
    await knex.schema.createTable('store_attendance', (t) => {
      t.increments('id').primary();
      t.integer('staff_id').unsigned().notNullable().references('id').inTable('store_staff').onDelete('CASCADE');
      t.date('attendance_date').notNullable();
      t.enum('status', ['Present', 'Absent', 'Late', 'Leave']).defaultTo('Present');
      t.text('reason').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 5. Add max_level to store_inventory
  // ============================================================
  if (await knex.schema.hasTable('store_inventory')) {
    if (!(await knex.schema.hasColumn('store_inventory', 'max_level'))) {
      await knex.schema.alterTable('store_inventory', (t) => {
        t.integer('max_level').nullable().defaultTo(0);
      });
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('store_attendance');
  await knex.schema.dropTableIfExists('store_staff');
  await knex.schema.dropTableIfExists('store_deliveries');
  await knex.schema.dropTableIfExists('store_suppliers');
  if (await knex.schema.hasTable('store_inventory')) {
    if (await knex.schema.hasColumn('store_inventory', 'max_level')) {
      await knex.schema.alterTable('store_inventory', (t) => t.dropColumn('max_level'));
    }
  }
};
