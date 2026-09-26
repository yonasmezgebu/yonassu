'use strict';

/**
 * Low-level, string-literal-aware SQL text utilities.
 *
 * Everything here operates on "raw" SQL text as it appears inside JS template
 * literals, where MySQL identifier quotes appear escaped as \` and JS
 * interpolations appear as ${...}.  Callers substitute interpolation sentinels
 * before calling in (see tools/mysql2pg/run.js).
 */

// ---------------------------------------------------------------------------
// scanning
// ---------------------------------------------------------------------------

/**
 * Walk `sql` once and report, for every character, whether it is inside a
 * single-quoted string, a double-quoted string, or a comment.  Used to make
 * sure regex replacements never corrupt string contents.
 * @returns {Uint8Array} state per char: 0 = code, 1 = '..', 2 = "..", 3 = -- , 4 = /* * /
 */
function scanStates(sql) {
  const st = new Uint8Array(sql.length);
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (c === "'" || c === '"') {
      const q = c;                 // the quote CHARACTER ...
      const code = (c === "'") ? 1 : 2;   // ... and its state code are different things
      st[i] = code;
      i++;
      while (i < n) {
        if (sql[i] === '\\') { st[i] = code; if (i + 1 < n) st[i + 1] = code; i += 2; continue; }
        if (sql[i] === q) {
          // doubled quote escape ('' or "")
          if (sql[i + 1] === q) { st[i] = code; st[i + 1] = code; i += 2; continue; }
          st[i] = code; i++; break;
        }
        st[i] = code; i++;
      }
      continue;
    }
    if (c === '-' && sql[i + 1] === '-') { st[i] = 3; st[i + 1] = 3; i += 2; while (i < n && sql[i] !== '\n') { st[i] = 3; i++; } continue; }
    if (c === '#') { st[i] = 3; i++; while (i < n && sql[i] !== '\n') { st[i] = 3; i++; } continue; }
    if (c === '/' && sql[i + 1] === '*') { st[i] = 4; st[i + 1] = 4; i += 2; while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) { st[i] = 4; i++; } if (i < n) { st[i] = 4; st[i + 1] = 4; i += 2; } continue; }
    i++;
  }
  return st;
}

/** Indices of characters that are real SQL code (not inside a literal/comment). */
function codeMask(sql) {
  const st = scanStates(sql);
  const m = new Uint8Array(sql.length);
  for (let i = 0; i < sql.length; i++) m[i] = st[i] === 0 ? 1 : 0;
  return m;
}

/**
 * Find the index of the `depth`-th top-level occurrence of `needle` (regex),
 * i.e. not nested inside parentheses/brackets and not inside a string literal.
 */
function indexOfTopLevel(sql, needleRe, from = 0) {
  const mask = codeMask(sql);
  const re = new RegExp(needleRe.source, needleRe.flags.includes('g') ? needleRe.flags : needleRe.flags + 'g');
  re.lastIndex = from;
  let m;
  while ((m = re.exec(sql))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    if (mask[m.index]) return { index: m.index, match: m };
  }
  return null;
}

/**
 * Split on top-level commas (paren depth 0, outside string literals).
 * Returns array of trimmed-ish chunks (whitespace preserved at edges).
 */
function splitTopLevel(sql, ch = ',') {
  const st = scanStates(sql);
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sql.length; i++) {
    if (st[i] !== 0) continue;
    const c = sql[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ch && depth === 0) { out.push(sql.slice(start, i)); start = i + 1; }
  }
  out.push(sql.slice(start));
  return out;
}

/** Locate the parenthesis matching the one at `openIdx`. */
function matchParen(sql, openIdx) {
  const st = scanStates(sql);
  let depth = 0;
  for (let i = openIdx; i < sql.length; i++) {
    if (st[i] !== 0) continue;
    if (sql[i] === '(') depth++;
    else if (sql[i] === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** Strip surrounding whitespace and a single layer of matching quotes/parens. */
function unwrap(s) {
  let t = s.trim();
  for (;;) {
    if (t.length >= 2 && t[0] === '(' && t[t.length - 1] === ')') {
      const inner = t.slice(1, -1);
      if (matchParen(t, 0) === t.length - 1) { t = inner.trim(); continue; }
    }
    break;
  }
  return t;
}

/** Read a single SQL token starting at i: identifier, quoted ident, or number. */
function readIdent(sql, i) {
  while (i < sql.length && /\s/.test(sql[i])) i++;
  if (sql[i] === '`') {                       // MySQL identifier, may be \`-escaped
    let j = i + 1; let out = '';
    while (j < sql.length) {
      if (sql[j] === '\\' && sql[j + 1] === '`') { out += '`'; j += 2; continue; }
      if (sql[j] === '`') { j++; return { name: out, end: j }; }
      out += sql[j]; j++;
    }
    return { name: out, end: j };
  }
  if (sql[i] === '"') {
    let j = i + 1; let out = '';
    while (j < sql.length) {
      if (sql[j] === '"' && sql[j + 1] === '"') { out += '"'; j += 2; continue; }
      if (sql[j] === '"') { j++; return { name: out, end: j, wasQuoted: true }; }
      out += sql[j]; j++;
    }
    return { name: out, end: j, wasQuoted: true };
  }
  const m = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(sql.slice(i));
  if (!m) return null;
  return { name: m[0], end: i + m[0].length };
}

// ---------------------------------------------------------------------------
// identifier + literal quoting
// ---------------------------------------------------------------------------

/**
 * PostgreSQL folds unquoted identifiers to lower case, which is exactly the
 * shape of this schema, so we emit *unquoted* identifiers.  That lets the
 * planner use statistics directly and avoids per-query identifier lookups.
 * We only quote when the name is not a safe bare identifier.
 *
 * `ident()` returns a *sentinel-wrapped* name rather than final text.  Callers
 * that also need to rewrite MySQL double-quoted string literals must be able to
 * tell "an identifier we are introducing" from "a string the author wrote", and
 * only the two can be told apart before the identifier pass runs.  Finish with
 * `resolveIdents()`.
 */
const ID_SENTINEL = '\u0002';
const SAFE_IDENT = /^[a-z_][a-z0-9_]*$/;
const PG_RESERVED = new Set([
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric', 'authorization',
  'between', 'binary', 'both', 'case', 'cast', 'check', 'collate', 'collation', 'column',
  'concurrently', 'constraint', 'create', 'cross', 'current_catalog', 'current_date',
  'current_role', 'current_schema', 'current_time', 'current_timestamp', 'current_user',
  'default', 'deferrable', 'desc', 'distinct', 'do', 'else', 'end', 'except', 'false',
  'fetch', 'for', 'foreign', 'freeze', 'from', 'full', 'grant', 'group', 'having', 'ilike',
  'in', 'initially', 'inner', 'intersect', 'into', 'is', 'isnull', 'join', 'lateral', 'leading',
  'left', 'like', 'limit', 'localtime', 'localtimestamp', 'natural', 'not', 'notnull',
  'null', 'offset', 'on', 'only', 'or', 'order', 'outer', 'overlaps', 'placing', 'primary',
  'references', 'returning', 'right', 'select', 'session_user', 'similar', 'some', 'symmetric',
  'table', 'then', 'to', 'trailing', 'true', 'union', 'unique', 'user', 'using', 'variadic',
  'verbose', 'when', 'where', 'window', 'with',
]);

/** The exact name text, still unquoted.  Used by resolveIdents. */
function identName(markup) {
  return markup.slice(1, -1);
}

function ident(name) {
  return ID_SENTINEL + name + ID_SENTINEL;
}

/** Final, printable identifier text (bare when safe, double-quoted otherwise). */
function identText(name) {
  if (SAFE_IDENT.test(name) && !PG_RESERVED.has(name)) return name;
  return '"' + name.replace(/"/g, '""') + '"';
}

/** Replace every sentinel-wrapped identifier with its final text. */
function resolveIdents(sql) {
  return sql.replace(/\u0002([^\u0002]*)\u0002/g, (m, name) => identText(name));
}

/** True if the text still contains unresolved identifier sentinels. */
function hasIdents(sql) {
  return sql.indexOf(ID_SENTINEL) >= 0;
}

/** Quote a value as a single-quoted SQL string literal. */
function lit(value) {
  if (value === null || value === undefined) return 'NULL';
  return "'" + String(value).replace(/'/g, "''") + "'";
}

module.exports = {
  scanStates, codeMask, indexOfTopLevel, splitTopLevel, matchParen, unwrap, readIdent,
  ident, identText, identName, resolveIdents, hasIdents, lit, ID_SENTINEL,
  SAFE_IDENT, PG_RESERVED,
};
