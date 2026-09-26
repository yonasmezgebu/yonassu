/**
 * Migration: Generalize product_tax_mappings to support every module.
 *
 * Previously mappings only referenced the generic `products` table (product_id).
 * Now each mapping targets an item inside a module catalog:
 *   source: printing | pharmacy | car_rental | agrirent | retail | tender_sell | tender_buy
 *   item_id / item_name: the module product reference (denormalized name snapshot)
 *
 * Idempotent via column existence checks.
 */

exports.up = async function (knex) {
  if (await knex.schema.hasTable('product_tax_mappings')) {
    const cols = await knex.raw('SELECT column_name AS "Field", data_type AS "Type", is_nullable AS "Null", column_default AS "Default", character_maximum_length AS "Length" FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = \'product_tax_mappings\' ORDER BY ordinal_position');
    const existing = new Set(cols.rows.map((c) => c.Field));

    if (!existing.has('source')) {
      await knex.raw('ALTER TABLE product_tax_mappings ADD COLUMN source varchar(50) NOT NULL DEFAULT \'retail\';');
    }
    if (!existing.has('item_id')) {
      await knex.raw('ALTER TABLE product_tax_mappings ADD COLUMN item_id bigint NULL;');
    }
    if (!existing.has('item_name')) {
      await knex.raw('ALTER TABLE product_tax_mappings ADD COLUMN item_name varchar(255) NULL;');
    }

    // Legacy product_id is now optional
    await knex.raw('ALTER TABLE product_tax_mappings ALTER COLUMN product_id TYPE integer;');

    // Backfill legacy rows that only referenced products.id
    await knex.raw(
      'UPDATE product_tax_mappings SET item_id = product_id, ' +
      'item_name = (SELECT name FROM products WHERE products.id = product_tax_mappings.product_id) ' +
      'WHERE item_id IS NULL AND product_id IS NOT NULL'
    );

    // Replace UNIQUE(product_id) with UNIQUE(source, item_id)
    const oldIdx = await knex.raw('SELECT c.relname AS "Table", a.attname AS "Column_name",\n       ci.relname AS "Key_name",\n       CASE WHEN i.indisunique THEN 0 ELSE 1 END AS "Non_unique",\n       pg_get_indexdef(i.indexrelid) AS index_def,\n       NULL AS seq_in_index, NULL AS sub_part, NULL AS "Null",\n       \'BTREE\' AS index_type, NULL AS "Comment", \'\' AS index_comment\nFROM pg_class c\nJOIN pg_index i     ON c.oid = i.indrelid\nJOIN pg_class ci    ON ci.oid = i.indexrelid\nJOIN pg_am am       ON am.oid = ci.relam\nJOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)\nWHERE c.relname = \'product_tax_mappings\' AND c.relkind = \'r\' AND am.amname = \'btree\'\n  AND a.attname = \'product_id\' AND i.indisunique\nORDER BY a.attname');
    if (oldIdx.rows && oldIdx.rows.length) {
      // Drop the legacy UNIQUE(product_id) index by the name the query just
      // found.  It is an index, not a column: `DROP COLUMN "INDEX"` (what the
      // MySQL original's shape converted to) would look for a column literally
      // named "index" and fail, leaving the old constraint in place.  A unique
      // index may be a bare index or the backing index of a UNIQUE constraint,
      // so drop the constraint first and then the index.
      for (const row of oldIdx.rows) {
        await knex.raw('ALTER TABLE product_tax_mappings DROP CONSTRAINT IF EXISTS ??', [row.Key_name]);
        await knex.raw('DROP INDEX IF EXISTS ??', [row.Key_name]);
      }
    }
    const newIdx = await knex.raw('SELECT c.relname AS "Table", a.attname AS "Column_name",\n       ci.relname AS "Key_name",\n       CASE WHEN i.indisunique THEN 0 ELSE 1 END AS "Non_unique",\n       pg_get_indexdef(i.indexrelid) AS index_def,\n       NULL AS seq_in_index, NULL AS sub_part, NULL AS "Null",\n       \'BTREE\' AS index_type, NULL AS "Comment", \'\' AS index_comment\nFROM pg_class c\nJOIN pg_index i     ON c.oid = i.indrelid\nJOIN pg_class ci    ON ci.oid = i.indexrelid\nJOIN pg_am am       ON am.oid = ci.relam\nJOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)\nWHERE c.relname = \'product_tax_mappings\' AND c.relkind = \'r\' AND am.amname = \'btree\'\n  AND a.attname = \'source\' AND i.indisunique\nORDER BY a.attname');
    if (!newIdx.rows || !newIdx.rows.length) {
      await knex.raw('CREATE UNIQUE INDEX uq_mapping_source_item ON product_tax_mappings (source, item_id);');
    }
  }

  if (await knex.schema.hasTable('product_tax_mapping_history')) {
    const cols = await knex.raw('SELECT column_name AS "Field", data_type AS "Type", is_nullable AS "Null", column_default AS "Default", character_maximum_length AS "Length" FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = \'product_tax_mapping_history\' ORDER BY ordinal_position');
    const existing = new Set(cols.rows.map((c) => c.Field));
    if (!existing.has('source')) {
      await knex.raw('ALTER TABLE product_tax_mapping_history ADD COLUMN source varchar(50) NULL;');
    }
    if (!existing.has('item_id')) {
      await knex.raw('ALTER TABLE product_tax_mapping_history ADD COLUMN item_id bigint NULL;');
    }
  }
};

exports.down = async function (knex) {
  // Intentionally no-op — reverting requires data-dependent decisions.
};
