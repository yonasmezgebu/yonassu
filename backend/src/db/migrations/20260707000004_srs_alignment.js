exports.up = async function (knex) {
  // ═══════════════════════════════════════════════════════════════
  // 1. drug_categories — lookup table referenced by drugs.category_id
  // ═══════════════════════════════════════════════════════════════
  if (!(await knex.schema.hasTable('drug_categories'))) {
    await knex.schema.createTable('drug_categories', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable().unique();
      t.text('description').nullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. manufacturers — referenced by drugs.manufacturer_id
  // ═══════════════════════════════════════════════════════════════
  if (!(await knex.schema.hasTable('manufacturers'))) {
    await knex.schema.createTable('manufacturers', (t) => {
      t.increments('id').primary();
      t.string('name', 200).notNullable().unique();
      t.string('country', 100).nullable();
      t.string('contact_phone', 50).nullable();
      t.string('contact_email', 200).nullable();
      t.text('address').nullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. warehouses — central facility(ies) holding bulk stock
  // ═══════════════════════════════════════════════════════════════
  if (!(await knex.schema.hasTable('warehouses'))) {
    await knex.schema.createTable('warehouses', (t) => {
      t.increments('id').primary();
      t.string('name', 150).notNullable().unique();
      t.string('code', 50).unique();
      t.text('address').nullable();
      t.string('phone', 50).nullable();
      t.string('manager_name', 100).nullable();
      t.enum('status', ['Active', 'Inactive']).defaultTo('Active');
      t.timestamps(true, true);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. Align drugs table with SRS
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('drugs')) {
    const addDrugCol = async (col, type, opts) => {
      if (!(await knex.schema.hasColumn('drugs', col))) {
        await knex.schema.alterTable('drugs', (t) => t[type](col, opts));
      }
    };
    await addDrugCol('drug_code', 'string', 50);
    await addDrugCol('generic_name', 'string', 150);
    await addDrugCol('brand_name', 'string', 150);
    await addDrugCol('dosage_form', 'string', 50);
    await addDrugCol('barcode', 'string', 100);
    await addDrugCol('manufacturer_id', 'integer');
    await addDrugCol('category_id', 'integer');

    // Add FK for manufacturer and category
    if (await knex.schema.hasColumn('drugs', 'manufacturer_id')) {
      try {
        await knex.schema.alterTable('drugs', (t) => {
          t.foreign('manufacturer_id').references('id').inTable('manufacturers');
        });
      } catch (e) { /* may already exist */ }
    }
    if (await knex.schema.hasColumn('drugs', 'category_id')) {
      try {
        await knex.schema.alterTable('drugs', (t) => {
          t.foreign('category_id').references('id').inTable('drug_categories');
        });
      } catch (e) { /* may already exist */ }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. Align store_inventory with SRS
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('store_inventory')) {
    const addStoreCol = async (col, type, opts) => {
      if (!(await knex.schema.hasColumn('store_inventory', col))) {
        await knex.schema.alterTable('store_inventory', (t) => t[type](col, opts));
      }
    };
    await addStoreCol('warehouse_id', 'integer');
    await addStoreCol('reserved_quantity', 'integer', 0);
    await addStoreCol('selling_price', 'decimal', [12, 2]);
    await addStoreCol('manufacture_date', 'date');
    await addStoreCol('notes', 'text');

    // Add stock_status column
    if (!(await knex.schema.hasColumn('store_inventory', 'stock_status'))) {
      await knex.schema.alterTable('store_inventory', (t) => {
        t.enu('stock_status', ['In Stock', 'Low Stock', 'Out of Stock', 'Expired']).nullable();
      });
    }

    // Add FK for warehouse
    if (await knex.schema.hasColumn('store_inventory', 'warehouse_id')) {
      try {
        await knex.schema.alterTable('store_inventory', (t) => {
          t.foreign('warehouse_id').references('id').inTable('warehouses');
        });
      } catch (e) { /* may already exist */ }
    }

    // Add unique constraint on (drug_id, warehouse_id, batch_no)
    try {
      await knex.schema.alterTable('store_inventory', (t) => {
        t.unique(['drug_id', 'warehouse_id', 'batch_no'], 'store_inventory_drug_warehouse_batch_unique');
      });
    } catch (e) { /* may already exist */ }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. Align pharmacy_inventory with SRS (per-branch, batch tracked)
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('pharmacy_inventory')) {
    const addPharmCol = async (col, type, opts) => {
      if (!(await knex.schema.hasColumn('pharmacy_inventory', col))) {
        await knex.schema.alterTable('pharmacy_inventory', (t) => t[type](col, opts));
      }
    };
    await addPharmCol('branch_id', 'integer');
    await addPharmCol('batch_no', 'string', 100);
    await addPharmCol('expiry_date', 'date');

    if (!(await knex.schema.hasColumn('pharmacy_inventory', 'stock_status'))) {
      await knex.schema.alterTable('pharmacy_inventory', (t) => {
        t.enu('stock_status', ['In Stock', 'Low Stock', 'Out of Stock', 'Expired']).nullable();
      });
    }

    if (!(await knex.schema.hasColumn('pharmacy_inventory', 'last_updated_at'))) {
      await knex.schema.alterTable('pharmacy_inventory', (t) => t.timestamp('last_updated_at').nullable());
    }

    // FK for branch
    if (await knex.schema.hasColumn('pharmacy_inventory', 'branch_id')) {
      try {
        await knex.schema.alterTable('pharmacy_inventory', (t) => {
          t.foreign('branch_id').references('id').inTable('branches');
        });
      } catch (e) { /* may already exist */ }
    }

    // Default branch_id to 1 for existing records (single-branch fallback)
    if (await knex.schema.hasColumn('pharmacy_inventory', 'branch_id')) {
      await knex('pharmacy_inventory').whereNull('branch_id').update({ branch_id: 1 });
    }

    // Unique constraint per (branch_id, drug_id, batch_no)
    try {
      await knex.schema.alterTable('pharmacy_inventory', (t) => {
        t.unique(['branch_id', 'drug_id', 'batch_no'], 'pharmacy_inventory_branch_drug_batch_unique');
      });
    } catch (e) { /* may already exist */ }

    // NOT NULL check on quantity
    try {
      await knex.raw('ALTER TABLE pharmacy_inventory ADD CONSTRAINT pharmacy_inventory_qty_check CHECK (quantity >= 0)');
    } catch (e) { /* may already exist */ }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. Alter stock_issues — add branch_id for SRS warehouse→branch
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('stock_issues')) {
    if (!(await knex.schema.hasColumn('stock_issues', 'branch_id'))) {
      await knex.schema.alterTable('stock_issues', (t) => {
        t.integer('branch_id').unsigned().nullable().references('id').inTable('branches');
      });
    }
    if (!(await knex.schema.hasColumn('stock_issues', 'warehouse_id'))) {
      await knex.schema.alterTable('stock_issues', (t) => {
        t.integer('warehouse_id').unsigned().nullable().references('id').inTable('warehouses');
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. Transfer Items — for multi-drug transfer support
  // ═══════════════════════════════════════════════════════════════
  if (!(await knex.schema.hasTable('transfer_items'))) {
    await knex.schema.createTable('transfer_items', (t) => {
      t.increments('id').primary();
      t.integer('transfer_request_id').unsigned().notNullable()
        .references('id').inTable('transfer_requests').onDelete('CASCADE');
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs');
      t.integer('quantity').notNullable().defaultTo(0);
      t.string('batch_no', 100).nullable();
      t.date('expiry_date').nullable();
      t.timestamps(true, true);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. Announcements — CEO broadcast messages
  // ═══════════════════════════════════════════════════════════════
  if (!(await knex.schema.hasTable('announcements'))) {
    await knex.schema.createTable('announcements', (t) => {
      t.increments('id').primary();
      t.string('title', 150).notNullable();
      t.text('message').notNullable();
      t.integer('created_by').notNullable().references('id').inTable('users');
      t.enu('target_audience', ['All Branches', 'Specific Branch', 'Managers Only']).notNullable().defaultTo('All Branches');
      t.integer('target_branch_id').unsigned().nullable().references('id').inTable('branches');
      t.timestamp('published_at').defaultTo(knex.fn.now());
      t.timestamp('expires_at').nullable();
      t.timestamps(true, true);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. Align transfer_requests with SRS
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('transfer_requests')) {
    const addTrCol = async (col, type, opts) => {
      if (!(await knex.schema.hasColumn('transfer_requests', col))) {
        await knex.schema.alterTable('transfer_requests', (t) => t[type](col, opts));
      }
    };
    await addTrCol('transfer_no', 'string', 50);
    await addTrCol('from_branch_id', 'integer');
    await addTrCol('from_warehouse_id', 'integer');
    await addTrCol('to_branch_id', 'integer');
    await addTrCol('requested_by', 'integer');
    await addTrCol('approved_by', 'integer');
    await addTrCol('ceo_approved_by', 'integer');
    await addTrCol('requested_date', 'date');
    await addTrCol('decision_date', 'date');
    await addTrCol('received_date', 'date');
    await addTrCol('reason', 'text');

    // Expand status ENUM to include SRS values
    try {
      await knex.raw("ALTER TABLE transfer_requests MODIFY COLUMN status ENUM('PENDING_APPROVAL','APPROVED','REJECTED','SHIPPED','COMPLETED','CANCELLED','Requested','In Transit','Received','Closed') NOT NULL DEFAULT 'Requested'");
    } catch (e) { /* already altered */ }

    // FKs
    try {
      if (await knex.schema.hasColumn('transfer_requests', 'from_branch_id')) {
        await knex.raw('ALTER TABLE transfer_requests ADD CONSTRAINT tr_from_branch_fk FOREIGN KEY (from_branch_id) REFERENCES branches(id)');
      }
      if (await knex.schema.hasColumn('transfer_requests', 'from_warehouse_id')) {
        await knex.raw('ALTER TABLE transfer_requests ADD CONSTRAINT tr_from_warehouse_fk FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id)');
      }
      if (await knex.schema.hasColumn('transfer_requests', 'to_branch_id')) {
        await knex.raw('ALTER TABLE transfer_requests ADD CONSTRAINT tr_to_branch_fk FOREIGN KEY (to_branch_id) REFERENCES branches(id)');
      }
    } catch (e) { /* FKs may already exist */ }
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. Align branches with SRS — add status ENUM
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('branches')) {
    if (!(await knex.schema.hasColumn('branches', 'status'))) {
      await knex.schema.alterTable('branches', (t) => {
        t.enu('status', ['Active', 'Inactive']).defaultTo('Active');
      });
      // Populate status from is_active
      await knex('branches').where('is_active', true).update({ status: 'Active' });
      await knex('branches').where('is_active', false).update({ status: 'Inactive' });
    }
    // Ensure code is populated
    await knex('branches').whereNull('code').update({ code: knex.raw('UPPER(LEFT(name, 3))') });
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. Add reorder_level to store_inventory if missing
  // ═══════════════════════════════════════════════════════════════
  if (await knex.schema.hasTable('store_inventory')) {
    if (!(await knex.schema.hasColumn('store_inventory', 'reorder_level'))) {
      await knex.schema.alterTable('store_inventory', (t) => {
        t.integer('reorder_level').defaultTo(0);
      });
    }
  }
};

exports.down = async function (knex) {
  // Reverse changes carefully
  const tables = ['announcements', 'transfer_items'];
  for (const t of tables) {
    if (await knex.schema.hasTable(t)) await knex.schema.dropTableIfExists(t);
  }
};
