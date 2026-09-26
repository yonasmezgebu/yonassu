'use strict';

const {
  splitTopLevel, matchParen, readIdent, ident, lit, indexOfTopLevel, unwrap, codeMask,
  resolveIdents,
} = require('./lex');

// ---------------------------------------------------------------------------
// type mapping
// ---------------------------------------------------------------------------

/**
 * MySQL type -> PostgreSQL type.
 * `enum` is handled separately because it also produces a CHECK constraint.
 */
function mapType(rawType, ctx) {
  const t = rawType.trim();
  const m = /^([A-Za-z]+)\s*(?:\(\s*([^)]*)\))?\s*(UNSIGNED|ZEROFILL)?\s*(?:CHARACTER SET\s+\S+)?\s*(?:COLLATE\s+\S+)?/i.exec(t);
  if (!m) return { sql: t };
  const name = m[1].toLowerCase();
  const arg = m[2] === undefined ? null : m[2].trim();

  switch (name) {
    case 'tinyint': {
      const n = arg === null ? 4 : parseInt(arg, 10);
      // tinyint(1) is MySQL's boolean; the old driver mapped it to JS true/false.
      return n === 1 ? { sql: 'boolean', bool: true } : { sql: 'smallint' };
    }
    case 'bit':
      return arg === '1' ? { sql: 'boolean', bool: true } : { sql: 'varbit' };
    case 'bool':
    case 'boolean':
      return { sql: 'boolean', bool: true };
    case 'smallint':
      return { sql: 'smallint' };
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'int2':
    case 'int4':
      return { sql: 'integer' };
    case 'bigint':
    case 'int8':
    case 'serial':
      return { sql: 'bigint' };
    case 'year':
      return { sql: 'smallint' };
    case 'decimal':
    case 'numeric':
      return { sql: arg ? `numeric(${arg})` : 'numeric' };
    case 'float':
      return { sql: arg ? `real` : 'real' };
    case 'double':
    case 'real':
      return { sql: 'double precision' };
    case 'char':
      return { sql: `char(${arg || 1})` };
    case 'varchar':
    case 'nvarchar':
      return { sql: `varchar(${arg || 255})` };
    case 'tinytext':
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return { sql: 'text' };
    case 'json':
      // jsonb: binary storage, no re-parse of keys on every access, indexable.
      return { sql: 'jsonb' };
    case 'enum':
      return { sql: 'citext', enumValues: splitEnumArgs(arg) };
    case 'set':
      return { sql: 'text' };
    case 'date':
      return { sql: 'date' };
    case 'datetime':
    case 'timestamp':
      // Naive on purpose: the app stored local wall-clock time under
      // timezone '+03:00'.  The session TimeZone is pinned to match, so
      // round-tripping is identical to the MySQL behaviour.
      return { sql: 'timestamp' };
    case 'time':
      return { sql: 'time' };
    case 'blob':
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
    case 'binary':
    case 'varbinary':
      return { sql: 'bytea' };
    case 'geometry':
    case 'point':
      return { sql: 'text' };
    default:
      if (ctx && ctx.onUnknownType) ctx.onUnknownType(t);
      return { sql: t };
  }
}

function splitEnumArgs(arg) {
  if (!arg) return [];
  return splitTopLevel(arg).map(s => unwrap(s).replace(/^'|'$/g, '').trim()).filter(s => s.length);
}

// ---------------------------------------------------------------------------
// default-value mapping
// ---------------------------------------------------------------------------

const ZERO = /^'0'$/;
const ONE = /^'1'$/;

function mapDefault(expr, isBool) {
  const d = expr.trim();
  if (isBool) {
    if (ZERO.test(d)) return 'false';
    if (ONE.test(d)) return 'true';
    if (/^true$/i.test(d) || /^false$/i.test(d)) return d.toLowerCase();
  }
  if (/^current_timestamp(\s*\(\s*\d*\s*\))?$/i.test(d)) return 'CURRENT_TIMESTAMP';
  if (/^now\(\s*\)$/i.test(d)) return 'CURRENT_TIMESTAMP';
  return d; // already a literal expression
}

// ---------------------------------------------------------------------------
// column definition
// ---------------------------------------------------------------------------

/**
 * MySQL column attributes that carry no PostgreSQL meaning.  These are matched
 * as whole *clauses*, not as loose whitespace-separated words, because MySQL
 * allows any order and several of them are multi-word.
 */
const DROP_CLAUSES = [
  /^UNSIGNED\b/i,
  /^ZEROFILL\b/i,
  /^CHARACTER\s+SET\s+[^\s,]+/i,
  /^CHARSET\s*=\s*[^\s,]+/i,
  /^COLLATE\s*[= ]\s*[^\s,]+/i,
  /^COMMENT\s+'(?:[^']|'')*'/i,
  /^COMMENT\s+"[^"]*"/i,
  /^COMMENT\s+[^\s,]+/i,
  /^COLUMN_FORMAT\s+\w+/i,
  /^STORAGE\s+\w+/i,
  /^SRID\s+\d+/i,
  /^ON\s+UPDATE\s+[^\s,]+/i,           // replaced by a trigger on updated_at
  /^FIRST\b/i,
  /^AFTER\s+(`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)/i,
];

/**
 * Convert one MySQL column definition into a PostgreSQL one.
 *
 * The definition is consumed clause by clause from the end of the type spec:
 * name -> type -> [attributes].  Attribute handling is deliberately ordered and
 * anchored, because a naive whitespace split breaks every multi-word MySQL
 * attribute (`NOT NULL`, `ON UPDATE CURRENT_TIMESTAMP`, `REFERENCES t (c)`).
 *
 * @returns {{sql:string, isPk:boolean, autoInc:boolean, colName:string, bool:boolean}}
 */
function convertColumn(def, ctx) {
  const s = def.trim();
  const id = readIdent(s, 0);
  if (!id) return { sql: s, isPk: false, autoInc: false, colName: null, bool: false };
  const colName = id.name;
  let i = id.end;

  // ---- type: leading whitespace, a word, then an optional balanced arg list ----
  while (i < s.length && /\s/.test(s[i])) i++;
  const wordM = /^[A-Za-z]+/.exec(s.slice(i));
  if (!wordM) {
    return {
      sql: `${ident(colName)} ${s.slice(i).trim()}`, isPk: false, autoInc: false, colName, bool: false,
    };
  }
  const typeStart = i;
  i += wordM[0].length;
  while (i < s.length && /\s/.test(s[i])) i++;   // allow `double  precision`
  let typeEnd = i;
  if (s[i] === '(') {
    const close = matchParen(s, i);
    if (close > 0) typeEnd = close + 1;
  }
  const typeRaw = s.slice(typeStart, typeEnd).trim();
  const mapped = mapType(typeRaw, ctx);

  // ---- attributes ----
  let tail = s.slice(typeEnd);
  const checks = [];
  const parts = [];
  let isPk = false;
  let autoInc = false;
  let inlineUnique = false;

  // Work on a mutable copy of the tail; clauses are stripped from the front.
  let rest = tail;
  const eat = (re) => {
    const m = re.exec(rest);
    if (!m || m.index !== 0) return null;
    rest = rest.slice(m[0].length);
    return m;
  };

  for (;;) {
    rest = rest.replace(/^\s+/, '');
    if (!rest) break;

    let dropped = false;
    for (const re of DROP_CLAUSES) {
      if (eat(re)) { dropped = true; break; }
    }
    if (dropped) continue;

    if (eat(/^AUTO_INCREMENT\b/i)) { autoInc = true; continue; }

    if (eat(/^NOT\s+NULL\b/i)) { parts.push({ k: 'notnull' }); continue; }
    if (eat(/^NULL\b/i)) { parts.push({ k: 'null' }); continue; }

    if (eat(/^PRIMARY\s+KEY\b/i)) { isPk = true; continue; }
    if (eat(/^UNIQUE\b/i)) { inlineUnique = true; continue; }
    if (eat(/^(?:KEY|INDEX)\b/i)) { continue; }   // MySQL shorthand; promoted to an index

    {
      const m = eat(/^DEFAULT\s+/i);
      if (m) {
        // The value runs to the next top-level attribute keyword, or to a
        // comma/paren boundary.  Parenthesised and quoted values are kept whole.
        const v = readDefaultValue(rest);
        rest = rest.slice(v.length);
        parts.push({ k: 'default', v: mapDefault(v, mapped.bool) });
        continue;
      }
    }

    {
      // REFERENCES other (cols) [ON DELETE ...] [ON UPDATE ...]
      const m = /^REFERENCES\s+/i.exec(rest);
      if (m) {
        const consumed = readReferences(rest);
        if (consumed) {
          parts.push({ k: 'ref', v: consumed });
          rest = rest.slice(consumed.length);
          continue;
        }
      }
    }

    {
      const m = eat(/^CHECK\s*\(/i);
      if (m) {
        const open = rest.indexOf('(');
        const close = matchParen(rest, open);
        if (close > 0) {
          checks.push(rest.slice(open + 1, close).trim());
          rest = rest.slice(close + 1);
          continue;
        }
      }
    }

    if (eat(/^GENERATED\s+ALWAYS\s+AS/i)) {
      // The expression is parenthesised in both dialects, so it can be lifted
      // across unchanged once the balanced group is located.
      const body = rest.replace(/^\s+/, '');
      const open = body.indexOf('(');
      const close = open >= 0 ? matchParen(body, open) : -1;
      if (close > 0) {
        const expr = body.slice(open + 1, close).trim();
        rest = body.slice(close + 1).replace(/^\s+/, '');
        const stored = eat(/^STORED\b/i);
        const virtual = !stored && eat(/^VIRTUAL\b/i);
        parts.push({
          k: 'raw',
          v: 'GENERATED ALWAYS AS (' + expr + ')' + (virtual ? '' : ' STORED'),
        });
        continue;
      }
    }

    // Unknown trailing junk: keep it so the PG parser complains loudly rather
    // than silently dropping a constraint.
    const m = /^[A-Za-z_][\w$]*/.exec(rest);
    if (m) {
      if (ctx && ctx.warnings) {
        ctx.warnings.push(`unhandled attribute "${m[0]}" on ${ctx.table || '?'}.${colName}`);
      }
      rest = rest.slice(m[0].length);
      continue;
    }
    if (ctx && ctx.warnings) {
      ctx.warnings.push(`unparsed tail "${rest.slice(0, 30)}" on ${ctx.table || '?'}.${colName}`);
    }
    break;
  }

  // ---- assemble in PostgreSQL's required order ----
  const order = [];
  const notNull = parts.some(p => p.k === 'notnull');
  const explicitNull = parts.some(p => p.k === 'null');
  if (autoInc) {
    order.push('GENERATED BY DEFAULT AS IDENTITY');
    // AUTO_INCREMENT only means "must be some kind of key" in MySQL; it does not
    // make the column the primary key.  Emitting an inline PRIMARY KEY here
    // would collide with the table-level `PRIMARY KEY (id)` that virtually every
    // migration also declares, and PostgreSQL rejects a table with two of them.
  }
  if (notNull) order.push('NOT NULL');
  else if (explicitNull) order.push('NULL');

  for (const p of parts) {
    if (p.k === 'default') order.push(`DEFAULT ${p.v}`);
    else if (p.k === 'ref') order.push(p.v);
    else if (p.k === 'raw') order.push(p.v);
  }
  if (isPk) order.push('PRIMARY KEY');
  if (inlineUnique) order.push('UNIQUE');

  let colSql = `${ident(colName)} ${mapped.sql}`;
  if (order.length) colSql += ' ' + order.join(' ');

  if (mapped.enumValues && mapped.enumValues.length) {
    const vals = mapped.enumValues.map(v => lit(v)).join(', ');
    // citext keeps MySQL's case-insensitive equality semantics for these columns
    // while remaining deterministic, so plain btree indexes still work.
    checks.push(`${ident(colName)} IN (${vals})`);
  }
  for (const c of checks) colSql += ` CHECK (${c})`;

  const defPart = parts.find(p => p.k === 'default');
  return {
    sql: colSql, isPk, autoInc, colName, bool: !!mapped.bool, unique: inlineUnique,
    type: mapped.sql, notNull, hasDefault: !!defPart,
    defaultVal: defPart ? defPart.v : null, ref: (parts.find(p => p.k === 'ref') || {}).v || null,
  };
}

/**
 * Read a DEFAULT value: either a balanced parenthesised group, a quoted string,
 * or a bare token, stopping before the next attribute keyword.
 */
function readDefaultValue(s) {
  if (!s) return '';
  if (s[0] === '(') {
    const c = matchParen(s, 0);
    return c > 0 ? s.slice(0, c + 1) : s.slice(0, 1);
  }
  if (s[0] === "'" || s[0] === '"') {
    const q = s[0];
    for (let i = 1; i < s.length; i++) {
      if (s[i] === '\\') { i++; continue; }
      if (s[i] === q) {
        if (s[i + 1] === q) { i++; continue; }
        return s.slice(0, i + 1);
      }
    }
    return s.slice(0, s.length);
  }
  // bare token: stop at whitespace followed by a known attribute keyword, or at
  // a comma / closing paren / end of input.
  const m = /^(?:[^\s,)]+)/.exec(s);
  return m ? m[0] : '';
}

/** Read `REFERENCES tbl (cols) [actions]` and return PostgreSQL form. */
function readReferences(s) {
  const m = /^REFERENCES\s+(`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)\s*(\([^)]*\))?/i.exec(s);
  if (!m) return null;
  const tbl = readIdent(m[1], 0).name;
  let out = `REFERENCES ${ident(tbl)}`;
  if (m[2]) {
    const cols = splitTopLevel(m[2].slice(1, -1)).map(c => quoteIfNeeded(c.trim()));
    out += ` (${cols.join(', ')})`;
  }
  const tail = s.slice(m[0].length);
  const actions = extractRefActions(tail);
  if (actions) out += ' ' + actions;
  return out;
}

// ---------------------------------------------------------------------------
// table-level elements
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Ctx
 * @property {Set<string>} indexNames  every index name already claimed (schema-global in PG)
 * @property {string} table
 */

/** Produce a schema-unique, table-scoped index name. */
function uniqueIndexName(ctx, table, raw) {
  let base = String(raw || '').replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
  if (!base) base = 'idx';
  if (base === 'primary') base = 'pk';
  // MySQL index names are table-local; PG index names are schema-global.
  const prefixed = base.startsWith(table + '_') ? base : `${table}_${base}`;
  let name = prefixed;
  let n = 2;
  while (ctx.indexNames.has(name.toLowerCase())) name = `${prefixed}_${n++}`;
  ctx.indexNames.add(name.toLowerCase());
  return name;
}

/**
 * Split a CREATE TABLE body into column defs, constraints, and standalone
 * CREATE INDEX statements (MySQL's inline `KEY (...)` has no PG equivalent).
 */
function convertTableBody(body, ctx) {
  const cols = [];
  const constraints = [];
  const indexes = [];
  const fkColumns = new Set();
  const indexedColumns = new Set();

  for (const rawPart of splitTopLevel(body)) {
    const part = rawPart.trim();
    if (!part) continue;

    const head = /^([A-Za-z_]+)/.exec(part);
    const word = head ? head[1].toUpperCase() : '';

    if (word === 'PRIMARY') {
      const open = part.indexOf('(');
      const close = matchParen(part, open);
      const colsList = splitTopLevel(part.slice(open + 1, close)).map(c => c.trim());
      colsList.forEach(c => markIndexed(indexedColumns, c));
      constraints.push(`PRIMARY KEY (${colsList.map(quoteIfNeeded).join(', ')})`);
      continue;
    }

    if (word === 'UNIQUE') {
      // UNIQUE KEY `name` (cols)  |  UNIQUE (cols)  |  UNIQUE INDEX `name` (cols)
      const km = /^UNIQUE\s+(?:KEY|INDEX)?\s*/i.exec(part);
      let after = part.slice(km[0].length);
      let name = null;
      if (after.trimStart().startsWith('`') || after.trimStart().startsWith('"')) {
        const id = readIdent(after, 0);
        name = id.name;
        after = after.slice(id.end);
      } else if (/^KEY\b/i.test(after.trim()) || /^INDEX\b/i.test(after.trim())) {
        after = after.trim().replace(/^(KEY|INDEX)\s+/i, '');
        if (after.startsWith('`') || after.startsWith('"')) {
          const id = readIdent(after, 0); name = id.name; after = after.slice(id.end);
        }
      }
      const open = after.indexOf('(');
      const close = matchParen(after, open);
      const colsList = splitTopLevel(after.slice(open + 1, close)).map(fixPrefixIndex);
      colsList.forEach(c => markIndexed(indexedColumns, c));
      const idxName = uniqueIndexName(ctx, ctx.table, name || colsList.join('_'));
      indexes.push({ kind: 'unique', name: idxName, cols: colsList });
      continue;
    }

    if (word === 'KEY' || word === 'INDEX') {
      // KEY `name` (cols)  |  KEY (cols)
      const km = /^(?:KEY|INDEX)\s+/i.exec(part);
      let after = part.slice(km[0].length);
      let name = null;
      if (after.trimStart().startsWith('`') || after.trimStart().startsWith('"')) {
        const id = readIdent(after, 0); name = id.name; after = after.slice(id.end);
      }
      const open = after.indexOf('(');
      const close = matchParen(after, open);
      // MySQL allows a prefix length (col(20)); PG needs an expression index.
      const colsList = splitTopLevel(after.slice(open + 1, close)).map(fixPrefixIndex);
      colsList.forEach(c => markIndexed(indexedColumns, c));
      const idxName = uniqueIndexName(ctx, ctx.table, name || colsList.join('_'));
      indexes.push({ kind: 'plain', name: idxName, cols: colsList });
      continue;
    }

    if (word === 'FOREIGN' || word === 'CONSTRAINT' || word === 'CHECK') {
      const conv = convertTableConstraint(part, ctx, fkColumns);
      if (conv) constraints.push(conv);
      continue;
    }

    if (word === 'FULLTEXT' || word === 'SPATIAL') {
      // No PG equivalent of the same name; a GIN trigram index is the analogue
      // but it is not equivalent enough to add silently.  Skip and report.
      if (ctx && ctx.warnings) ctx.warnings.push(`skipped ${word} index on ${ctx.table}: ${part.slice(0, 60)}`);
      continue;
    }

    // otherwise: a column definition
    const col = convertColumn(part, ctx);
    cols.push(col.sql);
    // Only a PRIMARY KEY or an inline UNIQUE actually makes the column indexed.
    // Recording every column here would wrongly suppress the FK indexes below.
    // An AUTO_INCREMENT column is keyed by definition in MySQL even when the key
    // itself is declared separately, so it counts as indexed too.
    if (col.isPk || col.unique || col.autoInc) markIndexed(indexedColumns, col.colName);
  }

  // MySQL auto-creates an index for every FK column; PG does not.  Without
  // these, every parent-side join and every FK cascade does a seq scan, which
  // is the single biggest performance difference when moving to PostgreSQL.
  for (const fk of fkColumns) {
    if (!indexedColumns.has(fk)) {
      indexes.push({ kind: 'plain', name: uniqueIndexName(ctx, ctx.table, `fk_${fk}`), cols: [ident(fk)] });
    }
  }

  return { cols, constraints, indexes };
}

/**
 * The bare column name a spec refers to, lower-cased, or null when the spec is
 * an expression (e.g. a rewritten prefix index) rather than a plain column.
 *
 * Identifiers may still be sentinel-wrapped at this point in the pipeline, so
 * they are resolved before being re-read.
 */
function baseCol(spec) {
  const s = resolveIdents(String(spec).trim());
  if (/\(/.test(s)) return null;
  const id = readIdent(s, 0);
  return id ? id.name.toLowerCase() : null;
}

/**
 * Record that `spec` is covered by an index, so the FK-index pass below does not
 * add a redundant one.  Expression indexes do not cover the bare column.
 */
function markIndexed(set, spec) {
  const b = baseCol(spec);
  if (b) set.add(b);
}

function quoteIfNeeded(spec) {
  const id = readIdent(spec, 0);
  return ident(id ? id.name : spec);
}

/** `col(20)` -> `left(col, 20)` (MySQL prefix index) */
function fixPrefixIndex(spec) {
  const m = /^(`(?:\\.|[^`])+`|"[^"]*"|[A-Za-z_][\w$]*)\s*\(\s*(\d+)\s*\)$/.exec(spec.trim());
  if (!m) return quoteIfNeeded(spec);
  return `left(${quoteIfNeeded(m[1])}, ${m[2]})`;
}

function convertTableConstraint(part, ctx, fkColumns) {
  let s = part.trim();
  let name = null;
  const cm = /^CONSTRAINT\s+/i.exec(s);
  if (cm) {
    const after = s.slice(cm[0].length);
    const id = readIdent(after, 0);
    if (id) { name = id.name; s = after.slice(id.end).trim(); }
  }
  s = s.replace(/^CONSTRAINT\s+/i, '');

  if (/^FOREIGN\s+KEY/i.test(s)) {
    const fk = /^FOREIGN\s+KEY\s*\(([^)]*)\)\s*(REFERENCES[\s\S]*)$/i.exec(s);
    if (fk) {
      const localCols = splitTopLevel(fk[1]).map(c => c.trim());
      localCols.forEach(c => { const k = baseCol(c); if (k) fkColumns.add(k); });
      const ref = readReferences(fk[2].trim());
      if (ref) {
        // PostgreSQL requires every foreign key to be named, MySQL does not, and
        // these dumps are full of bare `FOREIGN KEY (...) REFERENCES ...`.
        // An explicit name is already unique within its table, so it is kept
        // verbatim; only a synthesised one needs disambiguating.
        const cname = name
          || uniqueConstraintName(ctx, ctx.table,
            `fk_${localCols.map(c => (baseCol(c) || 'x')).join('_')}`);
        return `CONSTRAINT ${ident(cname)} FOREIGN KEY (${localCols.map(quoteIfNeeded).join(', ')}) ${ref}`;
      }
      if (ctx && ctx.warnings) ctx.warnings.push(`unparsed FK on ${ctx.table}: ${s.slice(0, 60)}`);
    }
    return s;
  }
  if (/^CHECK/i.test(s)) return s;
  if (/^UNIQUE/i.test(s)) return s;
  return s;
}

function uniqueConstraintName(ctx, table, raw) {
  // A constraint name only has to be unique within its own table, and
  // PostgreSQL keeps constraint names in a different namespace from index
  // names.  Registering it in ctx.indexNames would make the supporting index
  // for the very same foreign key collide and be renamed to "..._2", so the
  // two namespaces are tracked separately.
  const base = String(raw).replace(/[^A-Za-z0-9_]/g, '_').toLowerCase();
  const prefixed = base.startsWith(table + '_') ? base : `${table}_${base}`;
  const taken = ctx.constraintNames || (ctx.constraintNames = new Set());
  let name = prefixed; let n = 2;
  while (taken.has(name.toLowerCase())) name = `${prefixed}_${n++}`;
  taken.add(name.toLowerCase());
  return name;
}

function extractRefActions(s) {
  return s.replace(/\bON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION|SET\s+DEFAULT)/gi,
    (m, a) => `ON DELETE ${a.replace(/\s+/g, ' ').toUpperCase()}`)
    .replace(/\bON\s+UPDATE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION|SET\s+DEFAULT)/gi,
      (m, a) => `ON UPDATE ${a.replace(/\s+/g, ' ').toUpperCase()}`)
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// CREATE TABLE
// ---------------------------------------------------------------------------

/**
 * @param {string} sql  MySQL CREATE TABLE statement
 * @param {Ctx} ctx
 * @returns {string[]} PostgreSQL statements
 */
function convertCreateTable(sql, ctx) {
  const head = /^(\s*)CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?/i.exec(sql);
  if (!head) return null;
  const indent = head[1];
  const ifNotExists = head[2] ? 'IF NOT EXISTS ' : '';
  let rest = sql.slice(head[0].length);

  const tid = readIdent(rest, 0);
  if (!tid) return null;
  const table = tid.name;
  ctx.table = table;

  rest = rest.slice(tid.end);
  const open = rest.indexOf('(');
  if (open < 0) return null;
  const close = matchParen(rest, open);
  if (close < 0) return null;
  const body = rest.slice(open + 1, close);
  const tail = rest.slice(close + 1);

  const { cols, constraints, indexes } = convertTableBody(body, ctx);

  const lines = [];
  for (const c of cols) lines.push(indent + '  ' + c);
  for (const c of constraints) lines.push(indent + '  ' + c);
  const create = `${indent}CREATE TABLE ${ifNotExists}${ident(table)} (\n${lines.join(',\n')}\n${indent});`;

  const out = [create];
  for (const ix of indexes) {
    const uniq = ix.kind === 'unique' ? 'UNIQUE ' : '';
    out.push(`${indent}CREATE ${uniq}INDEX IF NOT EXISTS ${ident(ix.name)} ON ${ident(table)} (${ix.cols.join(', ')});`);
  }
  return out;
}

/**
 * MySQL tail options (ENGINE=..., DEFAULT CHARSET=..., COLLATE=...) carry no
 * PostgreSQL meaning; MySQL allows them to trail the closing paren.
 */
function stripMysqlTail(tail) { return tail.replace(/[\s\S]*$/, ''); }

module.exports = {
  mapType, mapDefault, convertColumn, convertCreateTable, convertTableBody,
  uniqueIndexName, quoteIfNeeded, baseCol, markIndexed, splitEnumArgs,
  readDefaultValue, readReferences, fixPrefixIndex, extractRefActions,
  stripMysqlTail,
};
