const knex = require('knex');
const { knexConfig } = require('../src/config/database');

async function run() {
  const db = knex(knexConfig);
  const dbName = knexConfig.connection.database;
  const tableExists = async (table) => {
    const row = await db('information_schema.TABLES')
      .where({ TABLE_SCHEMA: dbName, TABLE_NAME: table })
      .first();
    return !!row;
  };

  try {
    if (!(await tableExists('requisitions'))) {
      await db.schema.createTable('requisitions', (t) => {
        t.increments('id'); t.string('req_no', 30).notNullable().unique();
        t.integer('drug_id').notNullable(); t.string('drug_name', 255).notNullable();
        t.string('unit_of_measure', 50).defaultTo('Tablets');
        t.integer('quantity_requested').notNullable();
        t.integer('current_stock').notNullable(); t.integer('reorder_level').notNullable();
        t.text('justification');
        t.enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).defaultTo('PENDING');
        t.string('requesting_dept', 100).defaultTo('Pharmacy');
        t.integer('requested_by').notNullable(); t.string('requested_by_name', 100);
        t.text('rejection_reason');
        t.timestamp('created_at').defaultTo(db.fn.now()); t.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created requisitions table');
    } else console.log('⏭️  requisitions already exists');

    if (!(await tableExists('approvals'))) {
      await db.schema.createTable('approvals', (t) => {
        t.increments('id'); t.string('apr_no', 30).notNullable().unique();
        t.integer('requisition_id').notNullable(); t.string('req_no', 30).notNullable();
        t.integer('drug_id').notNullable(); t.string('drug_name', 255).notNullable();
        t.integer('quantity_requested').notNullable(); t.integer('quantity_approved').notNullable();
        t.enum('decision', ['PENDING', 'APPROVED', 'REJECTED']).defaultTo('PENDING');
        t.text('rejection_reason'); t.integer('approved_by'); t.string('approved_by_name', 100);
        t.string('stamp_id', 100); t.timestamp('approved_at');
        t.timestamp('created_at').defaultTo(db.fn.now()); t.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created approvals table');
    } else console.log('⏭️  approvals already exists');

    if (!(await tableExists('issue_vouchers'))) {
      await db.schema.createTable('issue_vouchers', (t) => {
        t.increments('id'); t.string('iss_no', 30).notNullable().unique();
        t.integer('approval_id').notNullable(); t.string('apr_no', 30).notNullable();
        t.integer('requisition_id').notNullable(); t.string('req_no', 30).notNullable();
        t.integer('drug_id').notNullable(); t.string('drug_name', 255).notNullable();
        t.string('unit_of_measure', 50).defaultTo('Tablets');
        t.integer('quantity_approved').notNullable(); t.integer('quantity_issued').notNullable();
        t.string('batch_number', 100); t.date('expiry_date');
        t.integer('store_stock_before').notNullable(); t.integer('store_stock_after').notNullable();
        t.enum('status', ['DRAFT', 'ISSUED', 'RECEIVED', 'COMPLETED']).defaultTo('DRAFT');
        t.integer('issued_by'); t.string('issued_by_name', 100); t.string('stamp_id', 100);
        t.timestamp('issued_at'); t.timestamp('created_at').defaultTo(db.fn.now()); t.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created issue_vouchers table');
    } else console.log('⏭️  issue_vouchers already exists');

    if (!(await tableExists('grn'))) {
      await db.schema.createTable('grn', (t) => {
        t.increments('id'); t.string('grn_no', 30).notNullable().unique();
        t.integer('issue_voucher_id').notNullable(); t.string('iss_no', 30).notNullable();
        t.integer('approval_id').notNullable(); t.string('apr_no', 30).notNullable();
        t.integer('requisition_id').notNullable(); t.string('req_no', 30).notNullable();
        t.integer('drug_id').notNullable(); t.string('drug_name', 255).notNullable();
        t.string('unit_of_measure', 50).defaultTo('Tablets');
        t.integer('quantity_expected').notNullable(); t.integer('quantity_received').notNullable();
        t.text('discrepancy_note'); t.enum('condition', ['Good', 'Damaged']).defaultTo('Good');
        t.integer('pharmacy_stock_before').notNullable(); t.integer('pharmacy_stock_after').notNullable();
        t.enum('status', ['PENDING', 'COMPLETED']).defaultTo('PENDING');
        t.integer('received_by'); t.string('received_by_name', 100); t.string('stamp_id', 100);
        t.timestamp('received_at'); t.timestamp('created_at').defaultTo(db.fn.now()); t.timestamp('updated_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created grn table');
    } else console.log('⏭️  grn already exists');

    if (!(await tableExists('stamps'))) {
      await db.schema.createTable('stamps', (t) => {
        t.increments('id'); t.string('stamp_id', 100).notNullable().unique();
        t.integer('document_id').notNullable(); t.string('document_type', 30).notNullable();
        t.integer('approved_by').notNullable(); t.string('approved_by_name', 100);
        t.string('role', 50).notNullable(); t.timestamp('timestamp').notNullable();
        t.string('hash', 255).notNullable(); t.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Created stamps table');
    } else console.log('⏭️  stamps already exists');

    console.log('\n✅ All ERP tables ready!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await db.destroy();
  }
}

run();
