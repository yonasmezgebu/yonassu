'use strict';

/**
 * mysql2pg - scan SQL literals for damage that a parser cannot see.
 *
 * `pgsql-ast-parser` only proves a statement is *grammatical*.  Several classes
 * of conversion bug survive that check because the broken result is still valid
 * grammar:
 *
 *   - a mangled function name   `SUMpg_total_relation_size(...)` parses fine as
 *                               a call to a function that does not exist
 *   - an empty identifier       `COALESCE(x, "")` parses; PG reads "" as a column
 *   - a stray MySQL tail        `ENGINE=InnoDB` inside a CREATE TABLE
 *   - MySQL-only functions      `IFNULL`, `FIND_IN_SET`, `DATE_FORMAT`
 *
 * This walks the real SQL literals via the converter's own driver, so plain
 * JavaScript that happens to contain the word "summary" or "min" is never
 * reported.
 *
 *   node tools/mysql2pg/audit-sql-damage.js [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { findRawSites, walkDir } = require('./driver');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const VERBOSE = process.argv.includes('--verbose');

/** The text a literal evaluates to, with `${...}` holes blanked out. */
function textOf(node) {
  if (node.type === 'TemplateLiteral' && node.quasis && node.quasis.length) {
    return { text: node.quasis.map(q => q.value.cooked).join('\u0000'), dynamic: node.quasis.length > 1 };
  }
  if (typeof node.value === 'string') return { text: node.value, dynamic: false };
  return null;
}

/**
 * Each rule: [name, regex, why].  The regex is applied to SQL text only, with
 * string literals already masked, so it cannot match quoted content.
 */
const RULES = [
  ['mangled aggregate', /\b(SUM|COUNT|AVG|MIN|MAX|ROUND|CAST|COALESCE|ABS|FLOOR|CEIL|GREATEST|LEAST|CONCAT|IFNULL|SUBSTRING|TRIM)(?=[A-Za-z_][A-Za-z0-9_]*\s*\()/, 'an aggregate lost its opening paren'],
  ['empty identifier', /(?<![A-Za-z0-9_.])""(?!\s*[),]?\s*[A-Za-z_])/, '"" is an empty identifier in PG, not an empty string'],
  ['mysql table tail', /\bENGINE\s*=\s*[A-Za-z]/i, 'ENGINE= is MySQL-only'],
  ['mysql charset', /\b(CHARSET|COLLATE)\s*[= ]/i, 'CHARSET/COLLATE are MySQL-only'],
  ['mysql functions', /\b(IFNULL|FIND_IN_SET|DATE_FORMAT|STR_TO_DATE|GROUP_CONCAT|CONVERT_TZ|UNIX_TIMESTAMP|SYSDATE|CURDATE|DATEDIFF|LAST_INSERT_ID)\s*\(/i, 'no PostgreSQL equivalent'],
  ['mysql variables', /@@[A-Za-z_]/, '@@ globals are MySQL-only'],
  ['on duplicate', /\bON\s+DUPLICATE\s+KEY\b/i, 'use ON CONFLICT'],
  ['insert ignore', /\bINSERT\s+IGNORE\b/i, 'use ON CONFLICT DO NOTHING'],
  ['mysql lock', /\b(GET_LOCK|RELEASE_LOCK|IS_FREE_LOCK)\s*\(/i, 'no PostgreSQL equivalent'],
  ['backtick', /`/, 'backtick quoting is MySQL-only'],
  ['drop column index', /DROP\s+COLUMN\s+"?INDEX"?/i, 'a MySQL DROP INDEX converted into a column drop'],
  ['unsigned type', /\b(?:TINYINT|SMALLINT|MEDIUMINT|INT|BIGINT)\s*\(\s*\d+\s*\)\s+UNSIGNED/i, 'no UNSIGNED in PG'],
  ['datetime zero', /\bDATETIME\s*\(\s*\d+\s*\)\s+DEFAULT\s+('(?:0000-00-00[^']*)'|"(?:0000-00-00[^"]*)"|0)\b/i, 'MySQL zero date'],
  ['double paren empty', /\(\s*\(\s*\)\s*\)/, 'an identifier or expression collapsed to nothing'],
];

const findings = [];

for (const file of walkDir(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  let found;
  try { found = findRawSites(src); }
  catch { continue; }

  for (const site of found) {
    for (const arg of site.sqlArgs) {
      const got = textOf(arg);
      if (!got) continue;
      // Mask single-quoted literals so rules cannot match inside data values.
      const masked = got.text.replace(/'(?:[^']|'')*'/g, "''");
      for (const [name, re, why] of RULES) {
        const m = re.exec(masked);
        if (!m) continue;
        findings.push({
          rel, line: arg.loc.start.line, name, why,
          match: m[0].slice(0, 60),
          code: (src.split(/\r?\n/)[arg.loc.start.line - 1] || '').trim().slice(0, 150),
        });
      }
    }
  }
}

console.log('='.repeat(78));
console.log('AUDIT               : SQL damage a parser cannot see');
console.log(`findings            : ${findings.length}`);
console.log('='.repeat(78));

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.name)) byRule.set(f.name, []);
  byRule.get(f.name).push(f);
}
for (const [name, list] of [...byRule].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n[${name}]  ${list.length}   (${list[0].why})`);
  for (const f of list) {
    console.log(`  ${f.rel}:${f.line}   ${JSON.stringify(f.match)}`);
    if (VERBOSE) console.log(`        ${f.code}`);
  }
}

if (findings.length) process.exitCode = 1;
