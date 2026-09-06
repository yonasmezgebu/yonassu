// AgriRent "notify me when available" waitlist.
// Customers whose requested machine is currently Booked can leave their contact
// details + field/message info. When the machine returns to 'Available', the
// entry is marked 'notified' and the customer gets an in-app notification, and
// the Car Renting / Agri Rental manager can convert it into a walk-in order.
exports.up = async (knex) => {
  // Ensure 4-byte characters (emojis / Amharic) are storable in the tables this
  // feature writes to — without it, emoji notifications (🔔 / 🚜) fail silently.
  async function ensureUtf8mb4(table) {
    const res = await knex.raw(
      "SELECT TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      [table]
    );
    const collation = res[0]?.[0]?.TABLE_COLLATION || '';
    if (collation && collation !== 'utf8mb4_unicode_ci') {
      await knex.raw(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }
  }
  await ensureUtf8mb4('notifications');

  if (!(await knex.schema.hasTable('agrirent_waitlist'))) {
    await knex.schema.createTable('agrirent_waitlist', (t) => {
      t.bigIncrements('id');
      t.bigInteger('tractor_id').notNullable();
      t.bigInteger('user_id').nullable();
      t.string('customer_name', 191).notNullable();
      t.string('customer_phone', 50).notNullable();
      t.string('customer_email', 191).nullable();
      t.string('field_location', 191).nullable();
      t.decimal('field_size_hectares', 10, 2).nullable();
      t.string('farming_purpose', 100).nullable();
      t.date('preferred_start_date').nullable();
      t.date('preferred_end_date').nullable();
      t.text('message').nullable();
      t.enu('status', ['waiting', 'notified', 'converted', 'removed'], { useNative: false }).defaultTo('waiting');
      t.timestamp('notified_at').nullable();
      t.timestamp('converted_at').nullable();
      t.timestamp('removed_at').nullable();
      t.bigInteger('converted_order_id').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
  await ensureUtf8mb4('agrirent_waitlist');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('agrirent_waitlist');
};