exports.up = async function (knex) {
  // 1. drugs table
  if (!(await knex.schema.hasTable('drugs'))) {
    await knex.schema.createTable('drugs', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('strength');
      t.string('unit');
      t.decimal('unit_price', 10, 2);
      t.timestamps(true, true);
    });
  }

  // 2. pharmacy_inventory table
  if (!(await knex.schema.hasTable('pharmacy_inventory'))) {
    await knex.schema.createTable('pharmacy_inventory', (t) => {
      t.increments('id').primary();
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs').onDelete('CASCADE');
      t.integer('quantity').notNullable().defaultTo(0);
      t.integer('reorder_level').notNullable().defaultTo(0);
      t.timestamps(true, true);
    });
  }

  // 3. store_inventory table
  if (!(await knex.schema.hasTable('store_inventory'))) {
    await knex.schema.createTable('store_inventory', (t) => {
      t.increments('id').primary();
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs').onDelete('CASCADE');
      t.integer('quantity').notNullable().defaultTo(0);
      t.timestamps(true, true);
      // DB constraint to ensure quantity never goes below 0
      t.check('quantity >= 0', [], 'store_inventory_quantity_check');
    });
  }

  // 4. transfer_requests table
  if (!(await knex.schema.hasTable('transfer_requests'))) {
    await knex.schema.createTable('transfer_requests', (t) => {
      t.increments('id').primary();
      t.string('request_code').notNullable().unique();
      t.integer('drug_id').unsigned().notNullable().references('id').inTable('drugs').onDelete('CASCADE');
      t.integer('requested_qty').notNullable();
      t.integer('pharmacy_qty_at_request').notNullable();
      t.integer('store_qty_at_request').notNullable();
      t.enum('urgency', ['LOW', 'MEDIUM', 'HIGH']).notNullable().defaultTo('MEDIUM');
      t.enum('status', ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SHIPPED', 'COMPLETED', 'CANCELLED']).notNullable().defaultTo('PENDING_APPROVAL');
      
      t.integer('created_by').unsigned().notNullable(); // references users
      t.integer('decided_by').unsigned();
      t.text('decision_reason');
      
      t.integer('shipped_by').unsigned();
      t.integer('shipped_qty');
      t.datetime('shipped_at').nullable();
      
      t.integer('received_by').unsigned();
      t.integer('received_qty');
      t.datetime('received_at').nullable();
      
      t.timestamps(true, true);
    });
  }

  // 5. audit_logs table
  if (!(await knex.schema.hasTable('audit_logs'))) {
    await knex.schema.createTable('audit_logs', (t) => {
      t.increments('id').primary();
      t.string('entity_type').notNullable();
      t.integer('entity_id').unsigned().notNullable();
      t.string('action').notNullable();
      t.integer('actor_id').unsigned().notNullable();
      t.json('before_state');
      t.json('after_state');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 6. notifications table
  if (!(await knex.schema.hasTable('notifications'))) {
    await knex.schema.createTable('notifications', (t) => {
      t.increments('id').primary();
      t.integer('recipient_id').unsigned().notNullable();
      t.string('type').notNullable(); // e.g. TRANSFER_APPROVED
      t.string('title').notNullable();
      t.text('message').notNullable();
      t.string('link');
      t.integer('related_entity_id').unsigned();
      t.boolean('is_read').defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 7. push_subscriptions table
  if (!(await knex.schema.hasTable('push_subscriptions'))) {
    await knex.schema.createTable('push_subscriptions', (t) => {
      t.increments('id').primary();
      t.integer('user_id').unsigned().notNullable();
      t.string('endpoint').notNullable();
      t.string('p256dh_key').notNullable();
      t.string('auth_key').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('push_subscriptions');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('transfer_requests');
  await knex.schema.dropTableIfExists('store_inventory');
  await knex.schema.dropTableIfExists('pharmacy_inventory');
  await knex.schema.dropTableIfExists('drugs');
};
