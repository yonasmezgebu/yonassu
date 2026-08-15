/**
 * Migration: Product / Service Tax Mapping
 * Links each product (products table) to a VAT treatment (vat_configurations).
 * One mapping per product (unique product_id). Changes are audited in
 * product_tax_mapping_history so every reassignment is fully recorded.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('product_tax_mappings', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('product_id').unsigned().notNullable()
      .references('id').inTable('products').onDelete('CASCADE');
    t.integer('vat_config_id').unsigned().notNullable()
      .references('id').inTable('vat_configurations').onDelete('CASCADE');
    t.integer('created_by').unsigned().nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['product_id']);
  });

  await knex.schema.createTable('product_tax_mapping_history', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('product_id').unsigned().nullable();
    t.string('product_name', 255).nullable();
    t.integer('old_vat_config_id').unsigned().nullable();
    t.string('old_treatment', 50).nullable();
    t.integer('new_vat_config_id').unsigned().nullable();
    t.string('new_treatment', 50).nullable();
    t.integer('changed_by_id').unsigned().nullable();
    t.string('changed_by_name', 150).nullable();
    t.string('changed_by_role', 100).nullable();
    t.string('notes', 255).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_tax_mapping_history');
  await knex.schema.dropTableIfExists('product_tax_mappings');
};
