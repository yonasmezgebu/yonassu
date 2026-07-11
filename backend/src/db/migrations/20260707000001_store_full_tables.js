exports.up = async function (knex) {
  // ============================================================
  // 1. Extend store_inventory with batch/expiry/location columns
  // ============================================================
  if (await knex.schema.hasTable('store_inventory')) {
    if (!(await knex.schema.hasColumn('store_inventory', 'batch_no'))) {
      await knex.schema.alterTable('store_inventory', (t) => {
        t.string('batch_no', 100).nullable();
        t.date('expiry_date').nullable();
        t.decimal('unit_cost', 12, 2).nullable();
        t.string('storage_location', 100).nullable();
        t.timestamp('last_received_at').nullable();
        t.timestamp('last_issued_at').nullable();
      });
    }
  }

  // ============================================================
  // 2. stock_receipts — Goods Receiving Note (M19)
  // ============================================================
  if (!(await knex.schema.hasTable('stock_receipts'))) {
    await knex.schema.createTable('stock_receipts', (t) => {
      t.increments('id').primary();
      t.string('receipt_no', 50).notNullable().unique();
      t.integer('supplier_id').unsigned().nullable();
      t.string('supplier_name', 255).nullable();
      t.string('purchase_order_ref', 100).nullable();
      t.string('delivery_note_ref', 100).nullable();
      t.integer('received_by').unsigned().nullable();
      t.date('receipt_date').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 3. stock_receipt_items — line items for each receipt
  // ============================================================
  if (!(await knex.schema.hasTable('stock_receipt_items'))) {
    await knex.schema.createTable('stock_receipt_items', (t) => {
      t.increments('id').primary();
      t.integer('receipt_id').unsigned().notNullable().references('id').inTable('stock_receipts').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.string('batch_no', 100).nullable();
      t.date('expiry_date').nullable();
      t.date('manufacture_date').nullable();
      t.integer('quantity').notNullable().defaultTo(0);
      t.decimal('unit_cost', 12, 2).nullable();
      t.decimal('subtotal', 12, 2).nullable();
      t.string('storage_location', 100).nullable();
    });
  }

  // ============================================================
  // 4. stock_issues — Goods Issue Note (M22)
  // ============================================================
  if (!(await knex.schema.hasTable('stock_issues'))) {
    await knex.schema.createTable('stock_issues', (t) => {
      t.increments('id').primary();
      t.string('issue_no', 50).notNullable().unique();
      t.string('department', 255).nullable();
      t.string('issued_to', 150).nullable();
      t.string('requisition_ref', 50).nullable();
      t.string('approval_ref', 50).nullable();
      t.integer('issued_by').unsigned().nullable();
      t.date('issue_date').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 5. stock_issue_items — line items for each issue
  // ============================================================
  if (!(await knex.schema.hasTable('stock_issue_items'))) {
    await knex.schema.createTable('stock_issue_items', (t) => {
      t.increments('id').primary();
      t.integer('issue_id').unsigned().notNullable().references('id').inTable('stock_issues').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.string('batch_no', 100).nullable();
      t.integer('quantity').notNullable().defaultTo(0);
      t.decimal('unit_cost', 12, 2).nullable();
    });
  }

  // ============================================================
  // 6. stock_transfers — Inter-warehouse transfers
  // ============================================================
  if (!(await knex.schema.hasTable('stock_transfers'))) {
    await knex.schema.createTable('stock_transfers', (t) => {
      t.increments('id').primary();
      t.string('transfer_no', 50).notNullable().unique();
      t.string('from_location', 255).nullable();
      t.string('to_location', 255).nullable();
      t.string('transfer_type', 50).nullable();
      t.string('authorized_by', 150).nullable();
      t.integer('created_by').unsigned().nullable();
      t.date('transfer_date').nullable();
      t.enum('status', ['Pending', 'Approved', 'In Transit', 'Received', 'Cancelled']).defaultTo('Pending');
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 7. stock_transfer_items — line items for transfers
  // ============================================================
  if (!(await knex.schema.hasTable('stock_transfer_items'))) {
    await knex.schema.createTable('stock_transfer_items', (t) => {
      t.increments('id').primary();
      t.integer('transfer_id').unsigned().notNullable().references('id').inTable('stock_transfers').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.string('batch_no', 100).nullable();
      t.date('expiry_date').nullable();
      t.integer('quantity').notNullable().defaultTo(0);
    });
  }

  // ============================================================
  // 8. stock_adjustments — manual stock corrections
  // ============================================================
  if (!(await knex.schema.hasTable('stock_adjustments'))) {
    await knex.schema.createTable('stock_adjustments', (t) => {
      t.increments('id').primary();
      t.string('adjustment_no', 50).notNullable().unique();
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.string('batch_no', 100).nullable();
      t.string('adjustment_type', 100).nullable();
      t.integer('quantity_before').nullable();
      t.integer('quantity_after').nullable();
      t.integer('adjustment_qty').nullable();
      t.text('reason').nullable();
      t.string('approval_code', 100).nullable();
      t.integer('adjusted_by').unsigned().nullable();
      t.integer('approved_by').unsigned().nullable();
      t.date('adjustment_date').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 9. stock_counts — Physical inventory audits
  // ============================================================
  if (!(await knex.schema.hasTable('stock_counts'))) {
    await knex.schema.createTable('stock_counts', (t) => {
      t.increments('id').primary();
      t.string('count_no', 50).notNullable().unique();
      t.string('count_type', 50).nullable();
      t.date('count_date').nullable();
      t.integer('counted_by').unsigned().nullable();
      t.integer('verified_by').unsigned().nullable();
      t.enum('status', ['Draft', 'In Progress', 'Pending Verification', 'Verified', 'Closed']).defaultTo('Draft');
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 10. stock_count_items — per-item count results
  // ============================================================
  if (!(await knex.schema.hasTable('stock_count_items'))) {
    await knex.schema.createTable('stock_count_items', (t) => {
      t.increments('id').primary();
      t.integer('count_id').unsigned().notNullable().references('id').inTable('stock_counts').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.string('batch_no', 100).nullable();
      t.integer('system_quantity').nullable();
      t.integer('physical_quantity').nullable();
      t.integer('variance').nullable();
      t.string('reason_code', 100).nullable();
    });
  }

  // ============================================================
  // 11. store_requisitions — M20 Requisitions
  // ============================================================
  if (!(await knex.schema.hasTable('store_requisitions'))) {
    await knex.schema.createTable('store_requisitions', (t) => {
      t.increments('id').primary();
      t.string('requisition_no', 50).notNullable().unique();
      t.string('department', 255).nullable();
      t.string('requested_by', 150).nullable();
      t.string('priority', 50).defaultTo('Normal');
      t.enum('status', ['Pending', 'Approved', 'Issued', 'Rejected']).defaultTo('Pending');
      t.date('requisition_date').nullable();
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 12. store_requisition_items — line items for requisitions
  // ============================================================
  if (!(await knex.schema.hasTable('store_requisition_items'))) {
    await knex.schema.createTable('store_requisition_items', (t) => {
      t.increments('id').primary();
      t.integer('requisition_id').unsigned().notNullable().references('id').inTable('store_requisitions').onDelete('CASCADE');
      t.string('item_name', 255).nullable();
      t.integer('drug_id').unsigned().nullable().references('id').inTable('drugs');
      t.integer('quantity').notNullable().defaultTo(0);
      t.integer('quantity_approved').nullable();
      t.integer('quantity_issued').nullable();
    });
  }

  // ============================================================
  // 13. store_approved_requests — M21 Approved Request Register
  // ============================================================
  if (!(await knex.schema.hasTable('store_approved_requests'))) {
    await knex.schema.createTable('store_approved_requests', (t) => {
      t.increments('id').primary();
      t.string('approval_no', 50).notNullable().unique();
      t.integer('requisition_id').unsigned().nullable().references('id').inTable('store_requisitions');
      t.string('department', 255).nullable();
      t.string('approved_by', 150).nullable();
      t.date('approval_date').nullable();
      t.string('stamp_id', 50).nullable();
      t.enum('status', ['Active', 'Fulfilled', 'Cancelled']).defaultTo('Active');
      t.text('remarks').nullable();
      t.timestamps(true, true);
    });
  }

  // ============================================================
  // 14. store_approved_request_items — items per approval
  // ============================================================
  if (!(await knex.schema.hasTable('store_approved_request_items'))) {
    await knex.schema.createTable('store_approved_request_items', (t) => {
      t.increments('id').primary();
      t.integer('approval_id').unsigned().notNullable().references('id').inTable('store_approved_requests').onDelete('CASCADE');
      t.string('item_name', 255).nullable();
      t.integer('drug_id').unsigned().nullable().references('id').inTable('drugs');
      t.integer('quantity_approved').notNullable().defaultTo(0);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('store_approved_request_items');
  await knex.schema.dropTableIfExists('store_approved_requests');
  await knex.schema.dropTableIfExists('store_requisition_items');
  await knex.schema.dropTableIfExists('store_requisitions');
  await knex.schema.dropTableIfExists('stock_count_items');
  await knex.schema.dropTableIfExists('stock_counts');
  await knex.schema.dropTableIfExists('stock_adjustments');
  await knex.schema.dropTableIfExists('stock_transfer_items');
  await knex.schema.dropTableIfExists('stock_transfers');
  await knex.schema.dropTableIfExists('stock_issue_items');
  await knex.schema.dropTableIfExists('stock_issues');
  await knex.schema.dropTableIfExists('stock_receipt_items');
  await knex.schema.dropTableIfExists('stock_receipts');
  if (await knex.schema.hasTable('store_inventory')) {
    if (await knex.schema.hasColumn('store_inventory', 'batch_no')) {
      await knex.schema.alterTable('store_inventory', (t) => {
        t.dropColumn('batch_no');
        t.dropColumn('expiry_date');
        t.dropColumn('unit_cost');
        t.dropColumn('storage_location');
        t.dropColumn('last_received_at');
        t.dropColumn('last_issued_at');
      });
    }
  }
};
