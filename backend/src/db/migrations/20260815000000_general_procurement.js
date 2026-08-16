exports.up = async function(knex) {
  await knex.schema.createTable('general_procurement_requests', (t) => {
    t.increments('id').primary();
    t.string('request_code').unique();
    t.string('module').notNullable();
    t.string('item_name').notNullable();
    t.text('item_description');
    t.integer('quantity').notNullable();
    t.decimal('estimated_cost', 15, 2);
    t.enum('urgency', ['LOW', 'MEDIUM', 'HIGH']).defaultTo('MEDIUM');
    t.text('justification');
    t.text('requester_signature', 'longtext');
    t.integer('requested_by').unsigned();
    t.enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'WAIT']).defaultTo('PENDING');
    t.text('ceo_decision_reason');
    t.string('ceo_document_url');
    t.integer('decided_by').unsigned();
    t.datetime('decided_at');
    t.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('general_procurement_requests');
};
