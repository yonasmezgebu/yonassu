const { db } = require('./src/config/database');

async function migrate() {
  console.log('Adding new columns to manager_chats...');
  const hasReplyDm = await db.schema.hasColumn('manager_chats', 'reply_to_id');
  if (!hasReplyDm) {
    await db.schema.table('manager_chats', t => {
      t.integer('reply_to_id').unsigned().nullable();
      t.text('reactions').nullable();
    });
    console.log('✓ Added reply_to_id and reactions to manager_chats');
  } else {
    console.log('✓ Columns already exist in manager_chats');
  }

  console.log('Adding new columns to manager_chat_group_messages...');
  const hasReplyGroup = await db.schema.hasColumn('manager_chat_group_messages', 'reply_to_id');
  if (!hasReplyGroup) {
    await db.schema.table('manager_chat_group_messages', t => {
      t.integer('reply_to_id').unsigned().nullable();
      t.text('reactions').nullable();
    });
    console.log('✓ Added reply_to_id and reactions to manager_chat_group_messages');
  } else {
    console.log('✓ Columns already exist in manager_chat_group_messages');
  }

  console.log('\nMigration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
