exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('email_subscribers');
  if (!exists) {
    await knex.schema.createTable('email_subscribers', (t) => {
      t.increments('id').unsigned();
      t.string('email', 255).notNullable().unique();
      t.string('full_name', 255).nullable();
      t.string('source', 100).defaultTo('landing_page');
      t.enum('status', ['active', 'unsubscribed', 'bounced', 'spam']).defaultTo('active');
      t.string('ip_address', 45).nullable();
      t.string('user_agent', 512).nullable();
      t.boolean('email_verified').defaultTo(false);
      t.string('verify_token', 128).nullable();
      t.timestamp('verified_at').nullable();
      t.timestamp('unsubscribed_at').nullable();
      t.text('notes').nullable();
      t.timestamps(true, true);
      t.timestamp('deleted_at').nullable();
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('email_subscribers');
};
