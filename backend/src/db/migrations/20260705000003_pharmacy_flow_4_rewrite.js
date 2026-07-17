exports.up = async (knex) => {
  // ── 1. Clean Up Legacy Flow 4 Tables ─────────────────────────────────────
  const oldTables = [
    'pharmacy_manager_requests', 'pharmacy_branch_toggle_log', 'pharmacy_prescriptions',
    'pharmacy_customer_queries', 'pharmacy_drug_hide_log', 'pharmacy_expired_drugs',
    'pharmacy_audit_trail', 'pharmacy_finance_records', 'pharmacy_report_payments',
    'pharmacy_report_branches', 'pharmacy_sales_reports', 'pharmacy_payments',
    'pharmacy_sale_items', 'pharmacy_sales', 'pharmacy_workers', 'pharmacy_branches'
  ];
  for (const t of oldTables) {
    if (await knex.schema.hasTable(t)) await knex.schema.dropTableIfExists(t);
  }

  // ── 2. Alter Existing Drugs Table ───────────────────────────────────────
  if (await knex.schema.hasTable('drugs')) {
    if (!(await knex.schema.hasColumn('drugs', 'requires_prescription'))) {
      await knex.schema.alterTable('drugs', (t) => {
        t.boolean('requires_prescription').defaultTo(false);
      });
    }
    if (!(await knex.schema.hasColumn('drugs', 'vat_rate'))) {
      await knex.schema.alterTable('drugs', (t) => {
        t.decimal('vat_rate', 5, 2).defaultTo(15.00); // 15% standard Ethiopian VAT
      });
    }
  }

  // ── 3. Create Core Operations & Roles ───────────────────────────────────
  if (!(await knex.schema.hasTable('branches'))) {
    await knex.schema.createTable('branches', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.string('code', 10).unique();
      t.boolean('is_active').defaultTo(true);
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('workers'))) {
    await knex.schema.createTable('workers', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.integer('branch_id').unsigned().references('id').inTable('branches').onDelete('CASCADE');
      t.boolean('can_post').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  // ── 4. Customer & Prescriptions (Public Facing) ─────────────────────────
  if (await knex.schema.hasTable('customers')) {
    if (!(await knex.schema.hasColumn('customers', 'preferred_language'))) {
      await knex.schema.alterTable('customers', (t) => {
        t.string('preferred_language', 10).defaultTo('en'); // en or am (Amharic)
      });
    }
    if (!(await knex.schema.hasColumn('customers', 'password_hash'))) {
      await knex.schema.alterTable('customers', (t) => {
        t.string('password_hash', 255).nullable();
      });
    }
  }

  if (!(await knex.schema.hasTable('prescriptions'))) {
    await knex.schema.createTable('prescriptions', (t) => {
      t.increments('id').primary();
      t.integer('customer_id').references('id').inTable('customers').nullable();
      t.integer('submitted_by').unsigned().notNullable(); // customer_id or user_id (worker)
      t.string('submission_type', 30).notNullable().comment('ONLINE_UPLOAD / IN_PERSON_SCAN');
      t.text('file_url').notNullable();
      t.integer('drug_id').unsigned().references('id').inTable('drugs').nullable();
      t.string('drug_name_text', 200).nullable();
      t.integer('branch_id').unsigned().references('id').inTable('branches').notNullable();
      t.text('special_instructions').nullable();
      t.integer('quantity_requested').defaultTo(1);
      t.string('status', 30).defaultTo('SUBMITTED').comment('SUBMITTED / READY_FOR_PICKUP / FULFILLED / CANCELLED');
      t.string('reference_code', 50).unique().notNullable();
      t.timestamps(true, true);
    });
  }

  // ── 5. Sales & Payments (Strict Ethiopian Compliance) ───────────────────
  if (!(await knex.schema.hasTable('sales'))) {
    await knex.schema.createTable('sales', (t) => {
      t.increments('id').primary();
      t.string('sale_code', 50).unique().notNullable();
      t.integer('branch_id').unsigned().references('id').inTable('branches').notNullable();
      t.integer('worker_id').unsigned().references('id').inTable('workers').nullable();
      t.string('sale_type', 30).notNullable().comment('WALK_IN / ONLINE');
      t.integer('customer_id').references('id').inTable('customers').nullable();
      t.integer('prescription_id').unsigned().references('id').inTable('prescriptions').nullable();
      t.decimal('subtotal', 14, 2).defaultTo(0);
      t.decimal('vat_rate', 5, 2).defaultTo(0); // Blended rate or primary rate indicator
      t.decimal('vat_amount', 14, 2).defaultTo(0);
      t.decimal('total_amount', 14, 2).defaultTo(0); // Must be ETB
      t.string('status', 30).defaultTo('COMPLETED').comment('COMPLETED / VOIDED / REFUNDED');
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('sale_items'))) {
    await knex.schema.createTable('sale_items', (t) => {
      t.increments('id').primary();
      t.integer('sale_id').unsigned().references('id').inTable('sales').onDelete('CASCADE');
      t.integer('drug_id').unsigned().references('id').inTable('drugs');
      t.decimal('unit_price', 14, 2).notNullable();
      t.integer('quantity').notNullable();
      t.decimal('vat_rate', 5, 2).defaultTo(0);
      t.decimal('vat_amount', 14, 2).defaultTo(0);
      t.decimal('line_subtotal', 14, 2).notNullable(); // Before VAT
      t.decimal('line_total', 14, 2).notNullable(); // After VAT
    });
  }

  if (!(await knex.schema.hasTable('payments'))) {
    await knex.schema.createTable('payments', (t) => {
      t.increments('id').primary();
      t.integer('sale_id').unsigned().references('id').inTable('sales').onDelete('CASCADE');
      t.string('method', 30).notNullable().comment('CASH / BANK_TRANSFER / TELEBIRR');
      t.decimal('amount', 14, 2).notNullable();
      t.string('status', 30).defaultTo('PAID').comment('PAID / CASHOUT');
      
      // Fields for various methods
      t.string('recipient_name', 150).nullable();
      t.string('recipient_phone', 30).nullable();
      t.string('bank_name', 100).nullable();
      t.string('account_holder_name', 150).nullable();
      t.string('account_number', 50).nullable();
      t.string('telebirr_number', 30).nullable();
      t.string('telebirr_transaction_ref', 100).nullable();
      
      t.string('verification_status', 30).defaultTo('UNVERIFIED').comment('UNVERIFIED / VERIFIED / MISMATCH');
      t.text('mismatch_reason').nullable(); // Worker must provide if CASH mismatched
      t.string('receipt_code', 100).unique().notNullable(); // Sequential, immutable
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('cash_handovers'))) {
    await knex.schema.createTable('cash_handovers', (t) => {
      t.increments('id').primary();
      t.integer('worker_id').unsigned().references('id').inTable('workers');
      t.integer('branch_id').unsigned().references('id').inTable('branches');
      t.integer('payment_id').unsigned().references('id').inTable('payments');
      t.decimal('amount', 14, 2).notNullable();
      t.integer('handed_to').references('id').inTable('users');
      t.timestamp('handed_over_at').nullable();
      t.string('status', 30).defaultTo('PENDING').comment('PENDING / SETTLED');
      t.timestamps(true, true);
    });
  }

  // ── 6. Reporting & Controls ───────────────────────────────────────────────
  if (!(await knex.schema.hasTable('daily_sales_reports'))) {
    await knex.schema.createTable('daily_sales_reports', (t) => {
      t.increments('id').primary();
      t.integer('branch_id').unsigned().references('id').inTable('branches').nullable();
      t.date('report_date').notNullable();
      t.integer('total_sales_count').defaultTo(0);
      t.decimal('total_amount', 14, 2).defaultTo(0);
      t.integer('submitted_by').references('id').inTable('users');
      t.string('status', 30).defaultTo('PENDING_FINANCE').comment('PENDING_FINANCE / APPROVED / REJECTED');
      t.text('finance_decision_reason').nullable();
      t.integer('decided_by').references('id').inTable('users').nullable();
      t.timestamp('decided_at').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('change_requests'))) {
    await knex.schema.createTable('change_requests', (t) => {
      t.increments('id').primary();
      t.integer('requested_by').references('id').inTable('users').notNullable();
      t.string('target_type', 50).notNullable().comment('DRUG_PRICE / DRUG_QUANTITY');
      t.integer('drug_id').unsigned().references('id').inTable('drugs').notNullable();
      t.decimal('current_value', 14, 2).notNullable();
      t.decimal('requested_value', 14, 2).notNullable();
      t.text('reason').notNullable();
      t.string('status', 30).defaultTo('PENDING').comment('PENDING / APPROVED / REJECTED');
      t.integer('decided_by').references('id').inTable('users').nullable();
      t.text('decision_reason').nullable();
      t.timestamp('decided_at').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('expired_drug_reports'))) {
    await knex.schema.createTable('expired_drug_reports', (t) => {
      t.increments('id').primary();
      t.integer('drug_id').unsigned().references('id').inTable('drugs').notNullable();
      t.string('location', 50).notNullable().comment('PHARMACY / STORE');
      t.integer('quantity').notNullable();
      t.date('expiry_date').notNullable();
      t.string('requested_action', 100).notNullable().comment('Dispose / Return to supplier / Write-off');
      t.integer('reported_by').references('id').inTable('users').notNullable();
      t.string('status', 30).defaultTo('PENDING').comment('PENDING / APPROVED / REJECTED');
      t.integer('decided_by').references('id').inTable('users').nullable();
      t.text('decision_reason').nullable();
      t.timestamp('decided_at').nullable();
      t.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('drug_visibility'))) {
    await knex.schema.createTable('drug_visibility', (t) => {
      t.increments('id').primary();
      t.integer('drug_id').unsigned().references('id').inTable('drugs').notNullable();
      t.integer('hidden_by').references('id').inTable('users').notNullable();
      t.text('reason').notNullable();
      t.string('mode', 30).notNullable().comment('TEMPORARY / PERMANENT');
      t.timestamp('auto_restore_at').nullable();
      t.boolean('is_hidden').defaultTo(true);
      t.timestamps(true, true);
    });
  }
};

exports.down = async (knex) => {
  const tables = [
    'drug_visibility', 'expired_drug_reports', 'change_requests', 'daily_sales_reports',
    'cash_handovers', 'payments', 'sale_items', 'sales', 'prescriptions',
    'workers', 'branches'
  ];
  for (const t of tables) {
    if (await knex.schema.hasTable(t)) await knex.schema.dropTableIfExists(t);
  }
};
