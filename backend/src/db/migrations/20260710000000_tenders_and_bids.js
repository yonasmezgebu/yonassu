exports.up = function(knex) {
  return knex.schema
    .createTable('public_tenders', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('status').defaultTo('draft'); // draft, pending, published, closed
      table.integer('created_by');
      table.integer('approved_by');
      table.timestamps(true, true);
    })
    .createTable('public_tender_items', table => {
      table.increments('id').primary();
      table.integer('public_tender_id').unsigned().references('id').inTable('public_tenders').onDelete('CASCADE');
      table.string('object_type').notNullable();
      table.string('unit');
      table.decimal('quantity', 14, 2).notNullable();
      table.timestamps(true, true);
    })
    .createTable('public_bids', table => {
      table.increments('id').primary();
      table.integer('public_tender_id').unsigned().references('id').inTable('public_tenders').onDelete('CASCADE');
      table.string('competitor_name').notNullable();
      table.text('digital_signature_text');
      table.text('hand_signature_path');
      table.timestamps(true, true);
    })
    .createTable('public_bid_items', table => {
      table.increments('id').primary();
      table.integer('public_bid_id').unsigned().references('id').inTable('public_bids').onDelete('CASCADE');
      table.integer('public_tender_item_id').unsigned().references('id').inTable('public_tender_items').onDelete('CASCADE');
      table.bigInteger('price_birr').notNullable();
      table.integer('price_cent').notNullable();
      table.bigInteger('total_birr').notNullable();
      table.integer('total_cent').notNullable();
      table.string('checkup');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('public_bid_items')
    .dropTableIfExists('public_bids')
    .dropTableIfExists('public_tender_items')
    .dropTableIfExists('public_tenders');
};
