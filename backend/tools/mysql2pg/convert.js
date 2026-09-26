'use strict';

const {
  ident, resolveIdents, lit, splitTopLevel, matchParen, readIdent, scanStates,
} = require('./lex');
const { convertCreateTable, convertColumn } = require('./ddl');
const { convertFunctions } = require('./functions');

// ---------------------------------------------------------------------------
// identifier quoting
// ---------------------------------------------------------------------------

/**
 * MySQL backtick identifiers become sentinel-wrapped names (see lex.ident), so
 * that fixDoubleQuotedLiterals below can tell an identifier we are introducing
 * from a string literal the author wrote.  Both are resolved by a single
 * resolveIdents() call at the very end of the pipeline.
 */
function requoteIdentifiers(sql) {
  return sql.replace(/\\`/g, '\u0002').replace(/`/g, '\u0002');
}

/**
 * MySQL treats "..." as a string literal; PostgreSQL reads it as an identifier.
 *
 * By the time this runs, every real identifier is still sentinel-wrapped, so a
 * double-quoted token outside a single-quoted literal is author-written string
 * data.  The scanStates check is what makes that safe: without it, a JSON value
 * such as '["Admin","User"]' would have its inner quotes rewritten and the data
 * silently destroyed.  Each conversion is recorded for review.
 */
function fixDoubleQuotedLiterals(sql, warnings) {
  const st = scanStates(sql);
  let out = '';
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === '"' && st[i] === 2) {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === '"' && st[j] === 2)) j++;
      if (j < sql.length) {
        const inner = sql.slice(i + 1, j);
        if (inner === '') { out += sql[i]; i++; continue; }
        if (warnings) warnings.push('double-quoted literal converted: ' + sql.slice(i, j + 1).slice(0, 40));
        // Doubling any embedded quote is the exact inverse of the outer quoting.
        out += "'" + inner.replace(/\\"/g, '"').replace(/'/g, "''") + "'";
        i = j + 1;
        continue;
      }
    }
    out += sql[i];
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// SHOW / information_schema
// ---------------------------------------------------------------------------

function convertShowTables() {
  return 'SELECT tablename AS table_name FROM pg_tables WHERE schemaname = current_schema() ORDER BY tablename';
}

function convertShowColumns(sql) {
  // SHOW [FULL] COLUMNS FROM `t` [LIKE 'x']
  const m = /^\s*SHOW\s+(?:FULL\s+)?COLUMNS\s+(?:FROM|IN)\s+(`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)\s*([\s\S]*)$/i.exec(sql);
  if (!m) return null;
  const t = readIdent(m[1], 0).name;
  const rest = m[2] || '';
  const like = /LIKE\s+('(?:[^']|'')*')/i.exec(rest);
  let where = 'table_schema = current_schema() AND table_name = ' + lit(t);
  if (like) where += ' AND column_name LIKE ' + like[1];
  // `null` is a reserved word in PostgreSQL, hence the explicit identifiers.
  return 'SELECT column_name AS ' + ident('Field') + ', data_type AS ' + ident('Type')
    + ', is_nullable AS ' + ident('Null') + ', column_default AS ' + ident('Default')
    + ', character_maximum_length AS ' + ident('Length')
    + ' FROM information_schema.columns WHERE ' + where + ' ORDER BY ordinal_position';
}

function convertShowIndex(sql) {
  // SHOW INDEX FROM `t` [WHERE Column_name = 'x' AND Non_unique = 0]
  const m = /^\s*SHOW\s+(?:INDEX|INDEXES|KEYS)\s+(?:FROM|IN)\s+(`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)\s*([\s\S]*)$/i.exec(sql);
  if (!m) return null;
  const t = readIdent(m[1], 0).name;
  const w = /WHERE\s+([\s\S]*)$/i.exec(m[2] || '');
  let translated = w ? w[1] : null;
  if (translated) {
    // MySQL spells these columns Column_name / Non_unique.
    translated = translated
      .replace(/`?Column_name`?\s*=\s*('(?:[^']|'')*')/gi, 'a.attname = $1')
      .replace(/`?Non_unique`?\s*=\s*0/gi, 'i.indisunique')
      .replace(/`?Non_unique`?\s*=\s*1/gi, 'NOT i.indisunique');
  }
  // The old callers read [rows][0].Key_name, so that alias is preserved.
  return [
    'SELECT c.relname AS ' + ident('Table') + ', a.attname AS ' + ident('Column_name') + ',',
    '       ci.relname AS ' + ident('Key_name') + ',',
    '       CASE WHEN i.indisunique THEN 0 ELSE 1 END AS ' + ident('Non_unique') + ',',
    '       pg_get_indexdef(i.indexrelid) AS ' + ident('index_def') + ',',
    '       NULL AS ' + ident('seq_in_index') + ', NULL AS ' + ident('sub_part')
      + ', NULL AS ' + ident('Null') + ',',
    "       'BTREE' AS " + ident('index_type') + ', NULL AS ' + ident('Comment')
      + ", '' AS " + ident('index_comment'),
    'FROM pg_class c',
    'JOIN pg_index i     ON c.oid = i.indrelid',
    'JOIN pg_class ci    ON ci.oid = i.indexrelid',
    'JOIN pg_am am       ON am.oid = ci.relam',
    'JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)',
    `WHERE c.relname = ${lit(t)} AND c.relkind = 'r' AND am.amname = 'btree'`,
    (translated ? '  AND ' + translated : ''),
    'ORDER BY a.attname',
  ].filter(Boolean).join('\n');
}

function convertShowStatus(sql) {
  const m = /LIKE\s+('(?:[^']|'')*')/i.exec(sql);
  const want = m ? m[1].replace(/'/g, '').toLowerCase() : '';
  const v = ident('value');
  if (want.includes('thread')) {
    return "SELECT count(*)::bigint AS " + v + " FROM pg_stat_activity WHERE state <> 'idle'";
  }
  if (want.includes('max_connections')) {
    return "SELECT current_setting('max_connections')::bigint AS " + v;
  }
  return 'SELECT count(*)::bigint AS ' + v + ' FROM pg_stat_activity';
}

function convertShowVariables(sql) {
  const m = /LIKE\s+('(?:[^']|'')*')/i.exec(sql);
  if (!m) return 'SELECT name, setting AS ' + ident('value') + ' FROM pg_settings ORDER BY name';
  const name = m[1].replace(/'/g, '');
  return 'SELECT name, setting AS ' + ident('value') + ' FROM pg_settings WHERE name = ' + lit(name);
}

/** information_schema.TABLES size columns -> real PostgreSQL relation sizes. */
function convertInformationSchema(sql) {
  if (!/information_schema\.tables/i.test(sql)) return sql;
  let out = sql;
  const rel = "format('%I.%I', table_schema, table_name)::regclass";
  out = out.replace(/table_schema\s*=\s*DATABASE\s*\(\s*\)/gi, 'table_schema = current_schema()');
  // The parentheses are part of the match, so the replacement has to put them
  // back.  Emitting a bare `pg_total_relation_size(...)` here would swallow the
  // opening paren of any enclosing aggregate: `SUM(data_length + index_length)`
  // would become `SUMpg_total_relation_size(...)`, which still parses (as a call
  // to a function named SUMpg_total_relation_size) but is a runtime error.
  out = out.replace(/\(\s*data_length\s*\+\s*index_length\s*\)/gi,
    '(pg_total_relation_size(' + rel + '))');

  out = out.replace(/\bdata_length\b/gi, 'pg_table_size(' + rel + ')');
  out = out.replace(/\bindex_length\b/gi, 'pg_indexes_size(' + rel + ')');
  out = out.replace(/\btable_rows\b/gi,
    'CASE WHEN table_schema = current_schema() '
    + 'THEN (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name) ELSE NULL END');
  return out;
}

// ---------------------------------------------------------------------------
// statement-level rewrites
// ---------------------------------------------------------------------------

/** INSERT IGNORE INTO t (...) VALUES (...) -> INSERT INTO ... ON CONFLICT DO NOTHING */
function convertInsertIgnore(sql) {
  if (!/^\s*INSERT\s+IGNORE\s+INTO/i.test(sql)) return sql;
  return sql.replace(/^(\s*)INSERT\s+IGNORE\s+INTO/i, '$1INSERT INTO') + ' ON CONFLICT DO NOTHING';
}

/** MySQL allows TRUNCATE without the TABLE keyword; PostgreSQL does not. */
function fixTruncate(sql) {
  return sql.replace(/^(\s*)TRUNCATE\s+(?!TABLE\b)/i, '$1TRUNCATE TABLE ');
}

/** MySQL `LIMIT a, b` -> PostgreSQL `LIMIT b OFFSET a` */
function fixLimitOffset(sql) {
  return sql.replace(/\bLIMIT\s+(\d+)\s*,\s*(\d+)/gi, 'LIMIT $2 OFFSET $1');
}

/** CAST(x AS CHAR[(n)]) -> CAST(x AS TEXT / VARCHAR(n)) */
function fixCharCasts(sql) {
  return sql.replace(/\bAS\s+CHAR\s*(\(\s*\d+\s*\))?/gi,
    (m, len) => (len ? 'AS VARCHAR(' + len.replace(/[()\s]/g, '') + ')' : 'AS TEXT'));
}

/** MySQL RLIKE / REGEXP -> the PostgreSQL ~ operator */
function fixRegexpOperator(sql) {
  return sql.replace(/\s+(?:RLIKE|REGEXP)\s+/gi, ' ~ ');
}

/** MySQL FIND_IN_SET is a function, handled in functions.js; this is the operator form. */
function fixNotLike(sql) {
  return sql;
}

// ---------------------------------------------------------------------------
// ALTER TABLE
// ---------------------------------------------------------------------------

/**
 * Convert the MySQL ALTER TABLE statements used in this codebase.
 *
 * A single MySQL MODIFY/CHANGE can alter type, nullability and default at once;
 * PostgreSQL needs one statement per change, so several are emitted.
 */
function convertAlterTable(sql) {
  const m = /^\s*ALTER\s+TABLE\s+(`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)\s+([\s\S]*)$/i.exec(sql);
  if (!m) return null;
  const table = readIdent(m[1], 0).name;
  let rest = m[2].trim();
  while (rest.endsWith(';')) rest = rest.slice(0, -1).trim();

  const warnings = [];
  const ctx = { table, indexNames: new Set(), warnings };
  const out = [];
  const push = (s) => out.push(s.endsWith(';') ? s : s + ';');

  // MySQL allows several clauses separated by commas in one ALTER.
  for (const rawOp of splitTopLevel(rest)) {
    const op = rawOp.trim();
    if (!op) continue;
    const om = /^(ADD|MODIFY|CHANGE|DROP|ALTER|RENAME)\b/i.exec(op);
    if (!om) { warnings.push('unhandled ALTER op: ' + op.slice(0, 60)); continue; }
    const verb = om[1].toUpperCase();
    let after = op.slice(om[0].length).trim();

    if (verb === 'ADD') {
      // ADD [COLUMN] <def>  |  ADD INDEX/KEY name (cols)  |  ADD UNIQUE ...
      after = after.replace(/^COLUMN\s+/i, '');
      if (/^(PRIMARY\s+KEY)\b/i.test(after)) {
        const open = after.indexOf('(');
        const close = matchParen(after, open);
        const cols = splitTopLevel(after.slice(open + 1, close)).map(c => readIdent(c, 0).name);
        push(`ALTER TABLE ${ident(table)} ADD PRIMARY KEY (${cols.map(c => ident(c)).join(', ')})`);
        continue;
      }
      if (/^(UNIQUE|KEY|INDEX)\b/i.test(after)) {
        const km = /^(UNIQUE\s+)?(?:KEY|INDEX)\s+/i.exec(after);
        if (km) {
          const uniq = !!km[1];
          let tail = after.slice(km[0].length);
          let idxName = null;
          const named = /^(?:`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)\s*/.exec(tail);
          if (named && tail.slice(named[0].length).trimStart().startsWith('(')) {
            idxName = readIdent(tail, 0).name;
            tail = tail.slice(named[0].length);
          }
          const open = tail.indexOf('(');
          const close = matchParen(tail, open);
          const cols = splitTopLevel(tail.slice(open + 1, close)).map(c => c.trim());
          // PostgreSQL has no `ALTER TABLE ... ADD INDEX`; an index is always a
          // separate CREATE INDEX statement.
          if (idxName) {
            push(`CREATE ${uniq ? 'UNIQUE ' : ''}INDEX ${ident(idxName)} ON ${ident(table)} (${cols.join(', ')})`);
          } else {
            push(`ALTER TABLE ${ident(table)} ADD ${uniq ? 'UNIQUE ' : ''}(${cols.join(', ')})`);
          }
          continue;
        }
      }
      if (/^(CONSTRAINT|FOREIGN|CHECK)\b/i.test(after)) {
        push(`ALTER TABLE ${ident(table)} ADD ${after}`);
        continue;
      }
      const col = convertColumn(after, ctx);
      if (!col.colName) { warnings.push('unparsed ADD COLUMN: ' + after.slice(0, 50)); continue; }
      push(`ALTER TABLE ${ident(table)} ADD COLUMN ${col.sql}`);
      continue;
    }

    if (verb === 'MODIFY' || verb === 'CHANGE') {
      after = after.replace(/^COLUMN\s+/i, '');
      if (verb === 'CHANGE') {
        const first = readIdent(after, 0);
        if (first) {
          warnings.push('CHANGE COLUMN on ' + table + ' treated as MODIFY of ' + first.name);
          after = after.slice(first.end).trim();
        }
      }
      const col = convertColumn(after, ctx);
      if (!col.colName) { warnings.push('unparsed MODIFY on ' + table); continue; }
      const q = ident(col.colName);
      const t = ident(table);
      push(`ALTER TABLE ${t} ALTER COLUMN ${q} TYPE ${col.type}`);
      push(`ALTER TABLE ${t} ALTER COLUMN ${q} ${col.notNull ? 'SET' : 'DROP'} NOT NULL`);
      if (col.hasDefault) push(`ALTER TABLE ${t} ALTER COLUMN ${q} SET DEFAULT ${col.defaultVal}`);
      if (col.unique) push(`ALTER TABLE ${t} ADD UNIQUE (${q})`);
      continue;
    }

    if (verb === 'DROP') {
      after = after.replace(/^COLUMN\s+/i, '');
      const id = readIdent(after, 0);
      if (!id) { warnings.push('unhandled DROP: ' + after.slice(0, 50)); continue; }
      const kw = /\s+(CASCADE|RESTRICT)\s*$/i.exec(after.slice(id.end));
      push(`ALTER TABLE ${ident(table)} DROP COLUMN ${ident(id.name)}${kw ? ' ' + kw[1].toUpperCase() : ''}`);
      continue;
    }

    warnings.push('ALTER ' + verb + ' on ' + table + ' not auto-converted: ' + after.slice(0, 50));
  }

  if (out.length) ctx.table = table;
  out.warnings = warnings;
  return out;
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

/**
 * Convert a MySQL SQL fragment to PostgreSQL.
 * @param {string} sql
 * @param {{table?:string, indexNames?:Set<string>, warnings?:string[]}} ctx
 * @returns {string[]}
 */
function convertSql(sql, ctx = {}) {
  const warnings = ctx.warnings || [];
  const trimmed = sql.trim();
  if (!trimmed) return [sql];

  // PL/pgSQL is not MySQL and never needs converting.  Hand-written function
  // bodies and DO blocks are already valid PostgreSQL, and rewriting inside
  // them would corrupt them (a dollar-quoted body has no MySQL equivalent to
  // translate, and the naive text rules misread it).  Bailing out here also
  // keeps the validator from reporting them, since pgsql-ast-parser cannot
  // parse PL/pgSQL at all.
  if (/(LANGUAGE\s+plpgsql|AS\s+\$|^\s*DO\s+\$|^\s*DECLARE\b)/i.test(trimmed)) return [sql];

  // ---- DDL first: these return early.  Their identifiers are already final
  //      text, so they need the backtick pass plus a sentinel resolve, but NOT
  //      the double-quote-to-string pass: a lifted CHECK or generated-column
  //      expression may legitimately contain "quoted" identifiers. ----
  if (/^CREATE\s+TABLE\b/i.test(trimmed)) {
    const res = convertCreateTable(trimmed, {
      table: ctx.table, indexNames: ctx.indexNames || new Set(), warnings,
    });
    if (res) return res.map(s => resolveIdents(requoteIdentifiers(s)));
  }
  if (/^ALTER\s+TABLE\b/i.test(trimmed)) {
    const res = convertAlterTable(trimmed);
    if (res) {
      for (const w of res.warnings || []) warnings.push(w);
      return res.map(s => resolveIdents(requoteIdentifiers(s)));
    }

  }

  let out = trimmed;

  if (/^SHOW\b/i.test(out)) {
    if (/^SHOW\s+(?:FULL\s+)?TABLES/i.test(out)) out = convertShowTables(out);
    else if (/^SHOW\s+(?:FULL\s+)?COLUMNS/i.test(out)) out = convertShowColumns(out) || out;
    else if (/^SHOW\s+(?:INDEX|INDEXES|KEYS)/i.test(out)) out = convertShowIndex(out) || out;
    else if (/^SHOW\s+(?:GLOBAL\s+|SESSION\s+)?STATUS/i.test(out)) out = convertShowStatus(out);
    else if (/^SHOW\s+(?:GLOBAL\s+|SESSION\s+)?VARIABLES/i.test(out)) out = convertShowVariables(out);
    else warnings.push('unconverted SHOW: ' + out.slice(0, 60));
  } else {
    out = convertInsertIgnore(out);
  }
  out = fixTruncate(out);
  out = convertInformationSchema(out);
  out = fixLimitOffset(out);
  out = fixCharCasts(out);
  out = fixRegexpOperator(out);

  // ---- identifier + literal quoting ----
  out = requoteIdentifiers(out);
  out = fixDoubleQuotedLiterals(out, warnings);

  // ---- functions ----
  out = convertFunctions(out);

  // ---- resolve sentinel-wrapped identifiers ----
  out = resolveIdents(out);

  return [out];
}

module.exports = {
  convertSql, requoteIdentifiers, resolveIdents, fixDoubleQuotedLiterals, convertAlterTable,
  convertShowTables, convertShowColumns, convertShowIndex, convertShowStatus, convertShowVariables,
  convertInformationSchema, convertInsertIgnore, fixTruncate, fixLimitOffset, fixCharCasts,
};
