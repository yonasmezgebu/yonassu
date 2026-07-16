/**
 * Migration: Add is_custom and branch_scoped columns to roles table.
 * Also adds created_by to roles for tracking custom role creators.
 */
exports.up = async function (knex) {
  const hasIsCustom = await knex.schema.hasColumn('roles', 'is_custom');
  const hasBranchScoped = await knex.schema.hasColumn('roles', 'branch_scoped');
  const hasCreatedBy = await knex.schema.hasColumn('roles', 'created_by');

  await knex.schema.table('roles', (t) => {
    if (!hasIsCustom) {
      t.boolean('is_custom').defaultTo(false).notNullable().after('description');
    }
    if (!hasBranchScoped) {
      t.boolean('branch_scoped').defaultTo(false).notNullable().after('is_custom');
    }
    if (!hasCreatedBy) {
      t.integer('created_by').unsigned().nullable().after('branch_scoped');
    }
  });
};

exports.down = async function (knex) {
  await knex.schema.table('roles', (t) => {
    t.dropColumn('is_custom');
    t.dropColumn('branch_scoped');
    t.dropColumn('created_by');
  });
};
