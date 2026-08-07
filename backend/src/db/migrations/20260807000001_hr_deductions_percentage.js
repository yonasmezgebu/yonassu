/**
 * Migration: Add amount_type and percentage columns to hr_deductions
 * Allows storing whether a deduction is a fixed ETB amount or a percentage of base salary.
 */
exports.up = async (knex) => {
  await knex.schema.table('hr_deductions', (t) => {
    t.string('amount_type', 20).defaultTo('Fixed').notNullable().after('amount');
    // Stores the raw percentage value (e.g. 5 for 5%), NULL when amount_type is 'Fixed'
    t.decimal('percentage', 8, 4).nullable().after('amount_type');
  });
};

exports.down = async (knex) => {
  await knex.schema.table('hr_deductions', (t) => {
    t.dropColumn('amount_type');
    t.dropColumn('percentage');
  });
};
