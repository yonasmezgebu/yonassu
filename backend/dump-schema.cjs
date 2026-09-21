const mysql = require('mysql2/promise');
const fs = require('fs');

const CONN = { host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'sutana_ems' };

(async () => {
  const c = await mysql.createConnection({ ...CONN, multipleStatements: true });
  const [tablesRows] = await c.query(
    `SELECT TABLE_NAME AS name, TABLE_TYPE AS type FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
  );
  const baseTables = tablesRows.filter(r => r.type === 'BASE TABLE').map(r => r.name);
  const views = tablesRows.filter(r => r.type === 'VIEW').map(r => r.name);

  console.log('BASE TABLES:', baseTables.length);
  console.log('VIEWS:', views.length);

  const out = { connection: CONN, baseTables: [], views };

  for (const t of baseTables) {
    const [cols] = await c.query(
      `SELECT COLUMN_NAME AS field, COLUMN_TYPE AS type, IS_NULLABLE AS is_nullable,
              COLUMN_KEY AS col_key, COLUMN_DEFAULT AS default_val, EXTRA AS extra
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [t]
    );
    const [fkRows] = await c.query(
      `SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         AND REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY ORDINAL_POSITION`,
      [t]
    );
    out.baseTables.push({
      name: t,
      columns: cols.map(col => ({
        field: col.field,
        type: col.type,
        null: col.is_nullable === 'YES',
        key: col.col_key,
        default: col.default_val !== undefined && col.default_val !== null ? String(col.default_val) : null,
        extra: col.extra,
      })),
      foreignKeys: fkRows.map(f => ({ column: f.COLUMN_NAME, refTable: f.REFERENCED_TABLE_NAME, refColumn: f.REFERENCED_COLUMN_NAME })),
    });
  }
  fs.writeFileSync('db-schema-dump.json', JSON.stringify(out, null, 2));
  console.log('WRITTEN dump-schema-dump.json');
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });