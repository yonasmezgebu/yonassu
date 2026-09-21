const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const CONN = { host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'sutana_ems' };
const ORDER = require('./create-order.json');
const MIG_DIR = path.join(__dirname, 'src', 'db', 'migrations');

fs.mkdirSync(MIG_DIR, { recursive: true });

const sanitize = (name) => name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 60);

(async () => {
  const c = await mysql.createConnection({ ...CONN, multipleStatements: true });
  const pad = (n) => String(n).padStart(3, '0');
  const created = [];
  const summary = [];

  for (let i = 0; i < ORDER.length; i++) {
    const table = ORDER[i];
    const num = pad(i + 1);
    const [rows] = await c.query('SHOW CREATE TABLE `' + table + '`');
    const createSql = rows[0]['Create Table'];
    // strip trailing ';' if present
    const cleanSql = createSql.replace(/;\s*$/, '').trim()
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');

    const content = `// Migration step ${i + 1} of ${ORDER.length}\n` +
      `// Creates table: ${table}\n` +
      `exports.up = function (knex) {\n` +
      `  return knex.raw(\`${cleanSql}\`);\n` +
      `};\n\n` +
      `exports.down = function (knex) {\n` +
      `  return knex.schema.dropTableIfExists('${table}');\n` +
      `};\n`;
    const file = path.join(MIG_DIR, `${num}_${sanitize(table)}.js`);
    fs.writeFileSync(file, content);
    created.push(file);
    summary.push(`${num}  ${table}`);
  }

  fs.writeFileSync(path.join(__dirname, 'migrations-summary.txt'), summary.join('\n'));
  console.log('Generated migration files: ' + created.length);
  console.log('Sample:', created[0], '...', created[created.length - 1]);
  await c.end();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });