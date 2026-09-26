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
    const cols = await knex.raw('SELECT column_name AS "Field", data_type AS "Type", is_nullable AS "Null", column_default AS "Default", character_maximum_length AS "Length" FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = \'retail_orders\' ORDER BY ordinal_position');
    const existing = new Set(cols.rows.map((c) => c.Field));

    if (!existing.has('payment_ref')) {
      await knex.raw('ALTER TABLE retail_orders ADD COLUMN payment_ref varchar(255) NULL;');
    }
    if (!existing.has('payment_proof_path')) {
      await knex.raw('ALTER TABLE retail_orders ADD COLUMN payment_proof_path varchar(500) NULL;');
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('retail_orders')) {
    const cols = await knex.raw('SELECT column_name AS "Field", data_type AS "Type", is_nullable AS "Null", column_default AS "Default", character_maximum_length AS "Length" FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = \'retail_orders\' ORDER BY ordinal_position');
    const existing = new Set(cols.rows.map((c) => c.Field));
    if (existing.has('payment_proof_path')) {
      await knex.raw('ALTER TABLE retail_orders DROP COLUMN payment_proof_path;');
    }
    if (existing.has('payment_ref')) {
      await knex.raw('ALTER TABLE retail_orders DROP COLUMN payment_ref;');
    }
  }
};
