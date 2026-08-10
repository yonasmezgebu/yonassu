exports.up = async function (knex) {
  const hasCol = await knex.schema.hasColumn('hr_employees', 'overtime_payment');
  if (!hasCol) {
    await knex.schema.alterTable('hr_employees', (table) => {
      table.decimal('overtime_payment', 10, 2).defaultTo(0);
    });
  }
};
exports.down = async function (knex) {
  await knex.schema.alterTable('hr_employees', (table) => {
    table.dropColumn('overtime_payment');
  });
};
