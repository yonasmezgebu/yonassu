exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('payroll_company_aggregation');
  if (hasTable) {
    const hasPaidStatus = await knex.schema.hasColumn('payroll_company_aggregation', 'payment_status');
    if (!hasPaidStatus) {
      await knex.schema.alterTable('payroll_company_aggregation', (t) => {
        t.string('payment_status', 20).defaultTo('Unpaid');
        t.string('paid_by', 50);
        t.datetime('paid_date');
        t.string('payment_method', 50);
      });
    }
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('payroll_company_aggregation');
  if (hasTable) {
    const hasPaidStatus = await knex.schema.hasColumn('payroll_company_aggregation', 'payment_status');
    if (hasPaidStatus) {
      await knex.schema.alterTable('payroll_company_aggregation', (t) => {
        t.dropColumn('payment_status');
        t.dropColumn('paid_by');
        t.dropColumn('paid_date');
        t.dropColumn('payment_method');
      });
    }
  }
};
