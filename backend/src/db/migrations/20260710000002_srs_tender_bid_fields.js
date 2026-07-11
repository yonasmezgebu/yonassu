exports.up = function(knex) {
  return knex.schema
    .alterTable('public_tenders', table => {
      table.string('tender_number').nullable(); // e.g. TND-2026-001
      table.string('category').nullable();      // e.g. Medical Supplies, IT Equipment
      table.date('opening_date').nullable();
      table.date('closing_date').nullable();
    })
    .alterTable('public_bids', table => {
      table.string('delivery_time').nullable();  // e.g. "30 days"
      table.string('payment_terms').nullable();  // e.g. "50% upfront"
      table.string('bid_status').defaultTo('pending'); // pending, recommended, rejected, winner
      table.text('recommendation_reason').nullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('public_tenders', table => {
      table.dropColumn('tender_number');
      table.dropColumn('category');
      table.dropColumn('opening_date');
      table.dropColumn('closing_date');
    })
    .alterTable('public_bids', table => {
      table.dropColumn('delivery_time');
      table.dropColumn('payment_terms');
      table.dropColumn('bid_status');
      table.dropColumn('recommendation_reason');
    });
};
