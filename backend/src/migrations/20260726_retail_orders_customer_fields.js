exports.up = async function(knex) {
  const hasName  = await knex.schema.hasColumn('retail_orders', 'customer_name');
  const hasPhone = await knex.schema.hasColumn('retail_orders', 'customer_phone');
  const hasEmail = await knex.schema.hasColumn('retail_orders', 'customer_email');

  if (!hasName || !hasPhone || !hasEmail) {
    await knex.schema.alterTable('retail_orders', (t) => {
      if (!hasName)  t.string('customer_name').nullable();
      if (!hasPhone) t.string('customer_phone').nullable();
      if (!hasEmail) t.string('customer_email').nullable();
    });
    console.log('[Migration] Added customer_name, customer_phone, customer_email to retail_orders');
  } else {
    console.log('[Migration] Columns already exist – skipping');
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('retail_orders', (t) => {
    t.dropColumn('customer_name');
    t.dropColumn('customer_phone');
    t.dropColumn('customer_email');
  });
};
