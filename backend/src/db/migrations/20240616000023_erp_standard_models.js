exports.up = async function (knex) {
  const dbName = knex.client.database();

  const tableExists = async (table) => {
    const row = await knex('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  // Model 20 — Requisition
  if (!(await tableExists('requisitions'))) {
    await knex.schema.createTable('requisitions', (t) => {
      t.increments('id');
      t.string('req_no', 30).notNullable().unique();
      t.integer('drug_id').notNullable();
      t.string('drug_name', 255).notNullable();
      t.string('unit_of_measure', 50).defaultTo('Tablets');
      t.integer('quantity_requested').notNullable();
      t.integer('current_stock').notNullable().comment('Pharmacy stock at time of request');
      t.integer('reorder_level').notNullable();
      t.text('justification');
      t.enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).defaultTo('PENDING');
      t.string('requesting_dept', 100).defaultTo('Pharmacy');
      t.integer('requested_by').notNullable();
      t.string('requested_by_name', 100);
      t.text('rejection_reason');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Model 21 — Approval
  if (!(await tableExists('approvals'))) {
    await knex.schema.createTable('approvals', (t) => {
      t.increments('id');
      t.string('apr_no', 30).notNullable().unique();
      t.integer('requisition_id').notNullable().references('id').inTable('requisitions');
      t.string('req_no', 30).notNullable();
      t.integer('drug_id').notNullable();
      t.string('drug_name', 255).notNullable();
      t.integer('quantity_requested').notNullable();
      t.integer('quantity_approved').notNullable();
      t.enum('decision', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
      t.text('rejection_reason');
      t.integer('approved_by');
      t.string('approved_by_name', 100);
      t.string('stamp_id', 100);
      t.timestamp('approved_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Model 22 — Issue Note / Issuing Voucher
  if (!(await tableExists('issue_vouchers'))) {
    await knex.schema.createTable('issue_vouchers', (t) => {
      t.increments('id');
      t.string('iss_no', 30).notNullable().unique();
      t.integer('approval_id').notNullable().references('id').inTable('approvals');
      t.string('apr_no', 30).notNullable();
      t.integer('requisition_id').notNullable();
      t.string('req_no', 30).notNullable();
      t.integer('drug_id').notNullable();
      t.string('drug_name', 255).notNullable();
      t.string('unit_of_measure', 50).defaultTo('Tablets');
      t.integer('quantity_approved').notNullable();
      t.integer('quantity_issued').notNullable();
      t.string('batch_number', 100);
      t.date('expiry_date');
      t.integer('store_stock_before').notNullable();
      t.integer('store_stock_after').notNullable();
      t.enum('status', ['DRAFT', 'ISSUED', 'RECEIVED', 'COMPLETED']).defaultTo('DRAFT');
      t.integer('issued_by');
      t.string('issued_by_name', 100);
      t.string('stamp_id', 100);
      t.timestamp('issued_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Model 19 — Goods Receiving Note
  if (!(await tableExists('grn'))) {
    await knex.schema.createTable('grn', (t) => {
      t.increments('id');
      t.string('grn_no', 30).notNullable().unique();
      t.integer('issue_voucher_id').notNullable().references('id').inTable('issue_vouchers');
      t.string('iss_no', 30).notNullable();
      t.integer('approval_id').notNullable();
      t.string('apr_no', 30).notNullable();
      t.integer('requisition_id').notNullable();
      t.string('req_no', 30).notNullable();
      t.integer('drug_id').notNullable();
      t.string('drug_name', 255).notNullable();
      t.string('unit_of_measure', 50).defaultTo('Tablets');
      t.integer('quantity_expected').notNullable();
      t.integer('quantity_received').notNullable();
      t.text('discrepancy_note');
      t.enum('condition', ['Good', 'Damaged']).defaultTo('Good');
      t.integer('pharmacy_stock_before').notNullable();
      t.integer('pharmacy_stock_after').notNullable();
      t.enum('status', ['PENDING', 'COMPLETED']).defaultTo('PENDING');
      t.integer('received_by');
      t.string('received_by_name', 100);
      t.string('stamp_id', 100);
      t.timestamp('received_at');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Digital Stamps
  if (!(await tableExists('stamps'))) {
    await knex.schema.createTable('stamps', (t) => {
      t.increments('id');
      t.string('stamp_id', 100).notNullable().unique();
      t.integer('document_id').notNullable();
      t.string('document_type', 30).notNullable().comment('REQUISITION, APPROVAL, ISSUE, GRN');
      t.integer('approved_by').notNullable();
      t.string('approved_by_name', 100);
      t.string('role', 50).notNullable();
      t.timestamp('timestamp').notNullable();
      t.string('hash', 255).notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('grn');
  await knex.schema.dropTableIfExists('issue_vouchers');
  await knex.schema.dropTableIfExists('approvals');
  await knex.schema.dropTableIfExists('requisitions');
  await knex.schema.dropTableIfExists('stamps');
};
