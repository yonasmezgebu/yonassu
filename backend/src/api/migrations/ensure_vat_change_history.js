/**
 * Migration: Ensure vat_change_history exists.
 * Idempotent — the table may already exist on environments where the original
 * create_vat_configurations migration ran before the history table was added.
 */

exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('vat_change_history'))) {
    await knex.schema.createTable('vat_change_history', (t) => {
      t.increments('id').unsigned().primary();
      t.integer('vat_config_id').unsigned().notNullable()
        .references('id').inTable('vat_configurations').onDelete('CASCADE');
      t.enum('change_type', ['created', 'updated', 'approved', 'rejected', 'deactivated']).notNullable();
      t.decimal('old_rate', 5, 4).nullable();
      t.decimal('new_rate', 5, 4).nullable();
      t.string('old_treatment', 50).nullable();
      t.string('new_treatment', 50).nullable();
      t.date('old_effective_from').nullable();
      t.date('new_effective_from').nullable();
      t.integer('changed_by_id').unsigned().nullable();
      t.string('changed_by_name', 150).nullable();
      t.string('changed_by_role', 100).nullable();
      t.enum('approval_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
      t.integer('approved_by_id').unsigned().nullable();
      t.string('approved_by_name', 150).nullable();
      t.text('notes').nullable();
      t.string('ip_address', 45).nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('vat_change_history');
};
