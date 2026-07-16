exports.up = function(knex) {
  return knex.schema
    // HR Policies
    .createTable('hr_policies', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('category').notNullable();
      table.string('file_ref').nullable();
      table.integer('version_number').defaultTo(1);
      table.string('status').defaultTo('Draft'); // Draft, Pending Review, Published, Archived
      table.date('effective_date').nullable();
      table.integer('published_by').references('id').inTable('users').onDelete('SET NULL');
      table.integer('approved_by').references('id').inTable('users').onDelete('SET NULL');
      table.boolean('acknowledgment_required').defaultTo(false);
      table.boolean('send_to_all').defaultTo(false);
      table.text('description').nullable();
      table.timestamps(true, true);
    })
    
    // Policy Acknowledgments
    .createTable('hr_policy_acknowledgments', table => {
      table.increments('id').primary();
      table.integer('policy_id').unsigned().references('id').inTable('hr_policies').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('ip_address').nullable();
      table.timestamp('acknowledged_at').defaultTo(knex.fn.now());
    })

    // Announcements
    .createTable('hr_announcements', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('body').notNullable();
      table.integer('author_id').references('id').inTable('users').onDelete('SET NULL');
      table.json('audience_scope').nullable(); // e.g., { type: "all" }
      table.string('priority').defaultTo('Info'); // Info, Important, Urgent
      table.string('status').defaultTo('Published'); // Draft, Scheduled, Published, Expired, Retracted
      table.datetime('publish_at').defaultTo(knex.fn.now());
      table.datetime('expires_at').nullable();
      table.integer('linked_policy_id').unsigned().references('id').inTable('hr_policies').onDelete('SET NULL');
      table.timestamps(true, true);
    })

    // Announcement Read Receipts
    .createTable('hr_announcement_receipts', table => {
      table.increments('id').primary();
      table.integer('announcement_id').unsigned().references('id').inTable('hr_announcements').onDelete('CASCADE');
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('viewed_at').defaultTo(knex.fn.now());
    })

    // HR Audit Logs
    .createTable('hr_audit_logs', table => {
      table.increments('id').primary();
      table.integer('actor_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('action').notNullable(); // e.g., CREATE_POLICY, PUBLISH_ANNOUNCEMENT
      table.string('target_module').notNullable(); // e.g., policies, announcements
      table.string('target_id').notNullable(); // ID of the affected record
      table.json('before_state').nullable();
      table.json('after_state').nullable();
      table.string('ip_address').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('hr_audit_logs')
    .dropTableIfExists('hr_announcement_receipts')
    .dropTableIfExists('hr_announcements')
    .dropTableIfExists('hr_policy_acknowledgments')
    .dropTableIfExists('hr_policies');
};
