/**
 * One-time migration: adds `last_seen_at` column to the `users` table.
 * Run once: node scripts/add_last_seen_chat.js
 */
const { db } = require('../src/config/database');

async function run() {
  const hasCol = await db.schema.hasColumn('users', 'last_seen_at');
  if (hasCol) {
    console.log('✅ Column `last_seen_at` already exists on `users` — nothing to do.');
  } else {
    await db.schema.table('users', table => {
      table.timestamp('last_seen_at').nullable().defaultTo(null);
    });
    console.log('✅ Column `last_seen_at` added to `users`.');
  }
  await db.destroy();
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
