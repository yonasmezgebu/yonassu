exports.up = async function(knex) {
  // 1. Alter drugs table
  const hasDrugs = await knex.schema.hasTable('drugs');
  if (hasDrugs) {
    await knex.schema.alterTable('drugs', t => {
      t.string('category').nullable();
      t.string('classification').nullable();
      t.text('therapeutic_use').nullable();
      t.enum('status', ['PENDING', 'ACTIVE', 'REJECTED']).defaultTo('ACTIVE');
    });
  }

  // 2. Alter purchase_requests table
  const hasPurchaseRequests = await knex.schema.hasTable('purchase_requests');
  if (hasPurchaseRequests) {
    await knex.schema.alterTable('purchase_requests', t => {
      t.boolean('is_new_drug').defaultTo(false);
      t.string('new_drug_name').nullable();
      t.string('new_drug_strength').nullable();
      t.string('new_drug_category').nullable();
      t.string('new_drug_classification').nullable();
      t.text('new_drug_therapeutic_use').nullable();
      t.text('purpose_reason').nullable();
      
      // Alter drug_id to be nullable
      t.integer('drug_id').unsigned().nullable().alter();
      
      // Ensure scenario, store/pharmacy qty fields can be nullable for new drugs 
      // where they don't apply.
      t.enum('scenario', ['STORE_AND_PHARMACY_LOW', 'STORE_ONLY_LOW', 'NEW_DRUG']).nullable().alter();
      t.integer('store_qty_at_request').nullable().alter();
      t.integer('store_min_level').nullable().alter();
      t.integer('pharmacy_qty_at_request').nullable().alter();
      t.integer('pharmacy_reorder_level').nullable().alter();
    });
  }

  // 3. Alter tenders table
  const hasTenders = await knex.schema.hasTable('tenders');
  if (hasTenders) {
    await knex.schema.alterTable('tenders', t => {
      t.boolean('is_new_drug').defaultTo(false);
    });
  }

  // 4. Alter fund_requests table
  const hasFundRequests = await knex.schema.hasTable('fund_requests');
  if (hasFundRequests) {
    await knex.schema.alterTable('fund_requests', t => {
      t.boolean('is_new_drug').defaultTo(false);
    });
  }

  // 5. Alter payments table
  const hasPayments = await knex.schema.hasTable('payments');
  if (hasPayments) {
    await knex.schema.alterTable('payments', t => {
      t.boolean('is_new_drug').defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  // Rollback in reverse order
  const hasPayments = await knex.schema.hasTable('payments');
  if (hasPayments) {
    await knex.schema.alterTable('payments', t => {
      t.dropColumn('is_new_drug');
    });
  }

  const hasFundRequests = await knex.schema.hasTable('fund_requests');
  if (hasFundRequests) {
    await knex.schema.alterTable('fund_requests', t => {
      t.dropColumn('is_new_drug');
    });
  }

  const hasTenders = await knex.schema.hasTable('tenders');
  if (hasTenders) {
    await knex.schema.alterTable('tenders', t => {
      t.dropColumn('is_new_drug');
    });
  }

  const hasPurchaseRequests = await knex.schema.hasTable('purchase_requests');
  if (hasPurchaseRequests) {
    await knex.schema.alterTable('purchase_requests', t => {
      t.dropColumn('is_new_drug');
      t.dropColumn('new_drug_name');
      t.dropColumn('new_drug_strength');
      t.dropColumn('new_drug_category');
      t.dropColumn('new_drug_classification');
      t.dropColumn('new_drug_therapeutic_use');
      t.dropColumn('purpose_reason');
    });
  }

  const hasDrugs = await knex.schema.hasTable('drugs');
  if (hasDrugs) {
    await knex.schema.alterTable('drugs', t => {
      t.dropColumn('category');
      t.dropColumn('classification');
      t.dropColumn('therapeutic_use');
      t.dropColumn('status');
    });
  }
};
