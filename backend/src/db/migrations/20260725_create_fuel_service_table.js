exports.up = function(knex) {
  return knex.schema.createTable('car_renting_fuel_service', table => {
    table.increments('id').primary();
    table.string('asset_id').notNullable();
    table.string('asset_type').notNullable(); // 'car' or 'tractor'
    table.string('asset_name').notNullable();
    table.string('request_type').notNullable(); // 'Fuel' or 'Service'
    table.text('description').notNullable();
    table.integer('estimated_cost_cents').notNullable();
    table.string('requested_date').notNullable();
    
    // Workflow tracking
    table.enum('status', [
      'PENDING_CEO', 
      'PENDING_FINANCE', 
      'FINANCE_READY', 
      'PAYMENT_RELEASED', 
      'COMPLETED', 
      'REJECTED'
    ]).defaultTo('PENDING_CEO');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.string('priority').defaultTo('Normal'); // High, Normal
    table.string('driver_name'); // Specifically for cars
    table.string('reported_by');
    table.integer('current_mileage'); // Particularly for Fuel
    table.string('location');
    table.text('notes');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('car_renting_fuel_service');
};
