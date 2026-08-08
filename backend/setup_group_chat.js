const { db } = require('./src/config/database');

async function migrate() {
  const hasGroups = await db.schema.hasTable('manager_chat_groups');
  if (!hasGroups) {
    await db.schema.createTable('manager_chat_groups', t => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.text('description').nullable();
      t.integer('created_by').unsigned().nullable();
      t.timestamps(true, true);
    });
    console.log('✓ Created manager_chat_groups');
  }

  const hasMembers = await db.schema.hasTable('manager_chat_group_members');
  if (!hasMembers) {
    await db.schema.createTable('manager_chat_group_members', t => {
      t.increments('id').primary();
      t.integer('group_id').unsigned().notNullable();
      t.integer('user_id').unsigned().notNullable();
      t.boolean('is_banned').defaultTo(false);
      t.timestamp('joined_at').defaultTo(db.fn.now());
      t.unique(['group_id', 'user_id']);
    });
    console.log('✓ Created manager_chat_group_members');
  }

  const hasGroupMsgs = await db.schema.hasTable('manager_chat_group_messages');
  if (!hasGroupMsgs) {
    await db.schema.createTable('manager_chat_group_messages', t => {
      t.increments('id').primary();
      t.integer('group_id').unsigned().notNullable();
      t.integer('sender_user_id').unsigned().notNullable();
      t.text('message').nullable();
      t.string('file_url', 500).nullable();
      t.string('file_name', 255).nullable();
      t.string('file_type', 100).nullable();
      t.boolean('deleted').defaultTo(false);
      t.timestamps(true, true);
    });
    console.log('✓ Created manager_chat_group_messages');
  }

  const hasFileUrl = await db.schema.hasColumn('manager_chats', 'file_url');
  if (!hasFileUrl) {
    await db.schema.table('manager_chats', t => {
      t.string('file_url', 500).nullable();
      t.string('file_name', 255).nullable();
      t.string('file_type', 100).nullable();
    });
    console.log('✓ Added file columns to manager_chats');
  }

  console.log('\nAll done!');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
