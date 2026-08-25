exports.up = async function (knex) {
  const hasCol = await knex.schema.hasColumn('pharmacy_health_posts', 'selling_price');
  if (!hasCol) {
    await knex.schema.table('pharmacy_health_posts', (t) => {
      t.decimal('selling_price', 12, 2).nullable().after('price_unit');
    });
  }
};

exports.down = async function (knex) {
  const hasCol = await knex.schema.hasColumn('pharmacy_health_posts', 'selling_price');
  if (hasCol) {
    await knex.schema.table('pharmacy_health_posts', (t) => {
      t.dropColumn('selling_price');
    });
  }
};
