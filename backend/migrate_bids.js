const { db } = require('./src/config/database');

async function addColumns() {
  try {
    const hasOpenedAt = await db.schema.hasColumn('bids', 'opened_at');
    if (!hasOpenedAt) {
      await db.schema.alterTable('bids', table => {
        table.datetime('opened_at').nullable();
      });
      console.log('Added opened_at column to bids.');
    } else {
      console.log('opened_at column already exists.');
    }

    const hasNotificationSent = await db.schema.hasColumn('bids', 'notification_sent');
    if (!hasNotificationSent) {
      await db.schema.alterTable('bids', table => {
        table.boolean('notification_sent').defaultTo(false);
      });
      console.log('Added notification_sent column to bids.');
    } else {
      console.log('notification_sent column already exists.');
    }

    const hasDigitalSignature = await db.schema.hasColumn('bids', 'digital_signature');
    if (!hasDigitalSignature) {
      await db.schema.alterTable('bids', table => {
        table.string('digital_signature', 255).nullable();
      });
      console.log('Added digital_signature column to bids.');
    } else {
      console.log('digital_signature column already exists.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

addColumns();
