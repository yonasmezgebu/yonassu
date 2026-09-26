// Migration step 363
// Restores MySQL's `ON UPDATE CURRENT_TIMESTAMP` on every `updated_at` column.
//
// The conversion had to drop that clause: PostgreSQL has no column attribute for
// it, and leaving the column as a plain `timestamp` would silently stop
// `updated_at` from ever advancing.  A BEFORE UPDATE trigger puts it back.
//
// The function reproduces MySQL's rule exactly rather than the simpler
// "always overwrite" trigger: about 470 call sites in this codebase assign
// `updated_at` deliberately (`db.fn.now()`, `new Date()`, or a backdated value
// for audit rows).  If NEW differs from OLD the caller supplied a value and it
// is left alone; if NEW still equals OLD the statement did not mention the
// column, so it is stamped with the current time.  Overwriting unconditionally
// would discard every one of those explicit values.
//
// Tables are discovered from information_schema rather than hard-coded, so a
// table added later is covered by re-running this migration.
exports.up = async function (knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
    LANGUAGE plpgsql AS $fn$
    BEGIN
      IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
        NEW.updated_at = now();
      END IF;
      RETURN NEW;
    END;
    $fn$`);

  await knex.raw(`
    DO $do$
    DECLARE
      r record;
    BEGIN
      FOR r IN
        SELECT c.table_schema, c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.column_name = 'updated_at'
          AND c.data_type = 'timestamp without time zone'
        ORDER BY c.table_name
      LOOP
        EXECUTE format(
          'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I.%I',
          r.table_schema, r.table_name
        );
        EXECUTE format(
          'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I.%I'
          ' FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
          r.table_schema, r.table_name
        );
      END LOOP;
    END
    $do$`);
};

exports.down = async function (knex) {
  await knex.raw(`
    DO $do$
    DECLARE
      r record;
    BEGIN
      FOR r IN
        SELECT c.table_schema, c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.column_name = 'updated_at'
          AND c.data_type = 'timestamp without time zone'
        ORDER BY c.table_name
      LOOP
        EXECUTE format(
          'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I.%I',
          r.table_schema, r.table_name
        );
      END LOOP;
    END
    $do$`);
  await knex.raw('DROP FUNCTION IF EXISTS set_updated_at()');
};
