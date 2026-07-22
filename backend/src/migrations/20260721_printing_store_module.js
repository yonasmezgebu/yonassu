/**
 * Printing Store & Production Module Migration
 * Fully isolated from Pharmacy Store — no shared tables, no shared IDs
 */
exports.up = async function (knex) {
  // 1. Printing Store Machines
  await knex.schema.createTableIfNotExists('printing_store_machines', (t) => {
    t.increments('id').primary();
    t.string('machine_id', 30).notNullable().unique().comment('e.g. PSM-001');
    t.string('machine_name', 150).notNullable();
    t.string('model_serial', 150);
    t.enum('status', ['In Store', 'Moved to Production', 'Under Maintenance']).defaultTo('In Store');
    t.string('registered_by', 150).comment('General Store Keeper name');
    t.date('date_registered');
    t.decimal('internal_value', 15, 2).defaultTo(0).comment('Set by Finance only');
    t.text('condition_notes');
    t.timestamps(true, true);
  });

  // 2. Printing Store Materials
  await knex.schema.createTableIfNotExists('printing_store_materials', (t) => {
    t.increments('id').primary();
    t.string('material_id', 30).notNullable().unique().comment('e.g. PSMAT-001');
    t.string('material_name', 150).notNullable();
    t.enum('category', ['Paper', 'Ink', 'Toner', 'Chemical', 'Other']).defaultTo('Other');
    t.string('unit', 50).defaultTo('unit').comment('Roll, box, liter, kg, ream, etc.');
    t.decimal('quantity_in_store', 15, 3).defaultTo(0);
    t.decimal('unit_value', 15, 2).defaultTo(0).comment('Cost per unit, set by Finance');
    t.decimal('total_value', 15, 2).defaultTo(0).comment('quantity_in_store x unit_value');
    t.string('registered_by', 150);
    t.date('date_registered');
    t.timestamps(true, true);
  });

  // 3. Printing Production Machines
  await knex.schema.createTableIfNotExists('printing_production_machines', (t) => {
    t.increments('id').primary();
    t.string('machine_id', 30).notNullable().comment('Reference to printing_store_machines.machine_id');
    t.enum('status', ['Active/Functional', 'Idle in Production', 'Returned to Store']).defaultTo('Active/Functional');
    t.date('moved_date');
    t.string('approved_by', 150).comment('Printing Supervisor who approved the move');
    t.string('job_reference', 100).comment('Optional print job/order reference');
    t.timestamps(true, true);
  });

  // 4. Printing Production Materials
  await knex.schema.createTableIfNotExists('printing_production_materials', (t) => {
    t.increments('id').primary();
    t.string('material_id', 30).notNullable().comment('Reference to printing_store_materials.material_id');
    t.decimal('quantity_moved', 15, 3).defaultTo(0);
    t.decimal('quantity_consumed', 15, 3).defaultTo(0);
    t.decimal('quantity_remaining', 15, 3).defaultTo(0);
    t.date('moved_date');
    t.string('approved_by', 150);
    t.string('job_reference', 100);
    t.timestamps(true, true);
  });

  // 5. Printing Movement Log (Audit Trail)
  await knex.schema.createTableIfNotExists('printing_movement_log', (t) => {
    t.increments('id').primary();
    t.enum('item_type', ['Machine', 'Material']).notNullable();
    t.string('item_id', 30).notNullable();
    t.string('from_location', 100).defaultTo('Printing Store');
    t.string('to_location', 100).defaultTo('Printing Production');
    t.decimal('quantity', 15, 3).defaultTo(0).comment('For materials only');
    t.string('moved_by', 150).comment('General Store Keeper who released the item');
    t.string('approved_by', 150);
    t.string('notes', 500);
    t.enum('action_type', ['Move to Production', 'Return to Store', 'Consume', 'Register', 'Value Update']).defaultTo('Move to Production');
    t.timestamp('date_time').defaultTo(knex.fn.now());
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('printing_movement_log');
  await knex.schema.dropTableIfExists('printing_production_materials');
  await knex.schema.dropTableIfExists('printing_production_machines');
  await knex.schema.dropTableIfExists('printing_store_materials');
  await knex.schema.dropTableIfExists('printing_store_machines');
};
