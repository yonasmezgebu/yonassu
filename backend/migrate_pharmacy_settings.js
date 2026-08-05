const { db } = require('./src/config/database');

async function migrate() {
  try {
    // 1. Create pharmacy_settings table
    const hasSettings = await db.schema.hasTable('pharmacy_settings');
    if (!hasSettings) {
      await db.schema.createTable('pharmacy_settings', table => {
        table.increments('id').primary();
        table.string('contact_phone1').nullable();
        table.string('contact_phone2').nullable();
        table.string('contact_email').nullable();
        table.timestamps(true, true);
      });
      console.log('Created table: pharmacy_settings');
    } else {
      console.log('Table pharmacy_settings already exists');
    }

    // 2. Create pharmacy_messages table
    const hasMessages = await db.schema.hasTable('pharmacy_messages');
    if (!hasMessages) {
      await db.schema.createTable('pharmacy_messages', table => {
        table.increments('id').primary();
        table.string('sender_name').notNullable();
        table.string('sender_email').notNullable();
        table.string('sender_phone').nullable();
        table.text('message').notNullable();
        table.boolean('is_read').defaultTo(false);
        table.timestamps(true, true);
      });
      console.log('Created table: pharmacy_messages');
    } else {
      console.log('Table pharmacy_messages already exists');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
