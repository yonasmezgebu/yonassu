/**
 * Migration: Add payment proof columns to retail_orders.
 *
 * Public online orders can now submit EITHER a payment reference (payment ID)
 * OR an uploaded payment screenshot. Both are stored on the order so the
 * sales/finance team can verify.
 *
 * Idempotent via column existence checks.
 */

exports.up = async function (knex) {
  if (await knex.schema.hasTable('retail_orders')) {
    const cols = await knex.raw('SHOW COLUMNS FROM `retail_orders`');
    const existing = new Set(cols[0].map((c) => c.Field));

    if (!existing.has('payment_ref')) {
      await knex.raw('ALTER TABLE `retail_orders` ADD COLUMN `payment_ref` VARCHAR(255) NULL');
    }
    if (!existing.has('payment_proof_path')) {
      await knex.raw('ALTER TABLE `retail_orders` ADD COLUMN `payment_proof_path` VARCHAR(500) NULL');
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('retail_orders')) {
    const cols = await knex.raw('SHOW COLUMNS FROM `retail_orders`');
    const existing = new Set(cols[0].map((c) => c.Field));
    if (existing.has('payment_proof_path')) {
      await knex.raw('ALTER TABLE `retail_orders` DROP COLUMN `payment_proof_path`');
    }
    if (existing.has('payment_ref')) {
      await knex.raw('ALTER TABLE `retail_orders` DROP COLUMN `payment_ref`');
    }
  }
};
