exports.up = async function (knex) {
  const hasCol = await knex.schema.hasColumn('hr_employees', 'payment_method');
  if (!hasCol) {
    await knex.schema.alterTable('hr_employees', (t) => {
      t.string('payment_method', 50).defaultTo('Bank Transfer');
    });
  }
};

exports.down = async function (knex) {
  const hasCol = await knex.schema.hasColumn('hr_employees', 'payment_method');
  if (hasCol) {
    await knex.schema.alterTable('hr_employees', (t) => {
      t.dropColumn('payment_method');
    });
  }
};
