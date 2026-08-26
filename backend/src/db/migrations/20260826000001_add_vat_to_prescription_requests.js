exports.up = async function (knex) {
  const hasSubtotal = await knex.schema.hasColumn('prescription_requests', 'subtotal');
  if (!hasSubtotal) {
    await knex.schema.table('prescription_requests', (t) => {
      t.decimal('subtotal', 12, 2).nullable().after('delivery_fee');
      t.decimal('tax_amount', 12, 2).nullable().after('subtotal');
    });
  }
};

exports.down = async function (knex) {
  const hasSubtotal = await knex.schema.hasColumn('prescription_requests', 'subtotal');
  if (hasSubtotal) {
    await knex.schema.table('prescription_requests', (t) => {
      t.dropColumn('subtotal');
      t.dropColumn('tax_amount');
    });
  }
};
