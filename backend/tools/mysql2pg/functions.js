'use strict';

const { scanStates, indexOfTopLevel, matchParen, unwrap, readIdent, ident, lit, splitTopLevel } = require('./lex');

// ---------------------------------------------------------------------------
// helper: balanced-call rewriting
// ---------------------------------------------------------------------------

/**
 * Find `name(` in `sql` (outside literals) and return
 * { start, argsStart, argsEnd, end, args: [..] } for the first occurrence at
 * or after `from`, or null.
 */
function findCall(sql, name, from = 0) {
  const st = scanStates(sql);
  const re = new RegExp('\\b' + name + '\\s*\\(', 'gi');
  re.lastIndex = from;
  let m;
  while ((m = re.exec(sql))) {
    if (st[m.index] !== 0) continue;
    // must not be preceded by an identifier char or a dot
    const prev = m.index > 0 ? sql[m.index - 1] : '';
    if (/[A-Za-z0-9_$.]/.test(prev)) continue;
    const open = sql.indexOf('(', m.index);
    const close = matchParen(sql, open);
    if (close < 0) return null;
    const argStr = sql.slice(open + 1, close);
    return {
      start: m.index,
      nameEnd: open,
      open, close, end: close + 1,
      args: splitTopLevel(argStr),
      argStr,
    };
  }
  return null;
}

/**
 * Replace every call of `name` with `fn(call)`.
 *
 * The search cursor advances *past* each replacement, so a rewrite whose output
 * still contains the callee name (CONCAT_WS -> concat_ws) is not reprocessed
 * forever.  `fn` returning null leaves that one call untouched, which is how an
 * unrecognised arity or shape is deferred to a human.
 */
function replaceAllCalls(sql, name, fn) {
  let cursor = 0;
  let guard = 0;
  for (;;) {
    if (++guard > 2000) break;
    const c = findCall(sql, name, cursor);
    if (!c) break;
    const rep = fn(c);
    if (rep === null || rep === undefined) {
      // Skip this occurrence but keep scanning after it.
      cursor = c.end;
      continue;
    }
    sql = sql.slice(0, c.start) + rep + sql.slice(c.end);
    cursor = c.start + rep.length;
  }
  return sql;
}

// ---------------------------------------------------------------------------
// format translation
// ---------------------------------------------------------------------------

/**
 * Find `word` (case-insensitive, whole words) at paren depth 0 and outside any
 * string literal.  Used to locate clause keywords such as ORDER BY / SEPARATOR
 * inside an already-extracted argument list.
 * @returns {number} index, or -1
 */
function findTopLevelKeyword(s, word) {
  const st = scanStates(s);
  const re = new RegExp('\\b' + word.replace(/ /g, '\\s+') + '\\b', 'gi');
  let m;
  while ((m = re.exec(s))) {
    if (st[m.index] !== 0) continue;
    // reject a match that is really the tail of a longer identifier
    const before = m.index > 0 ? s[m.index - 1] : '';
    const after = s[m.index + m[0].length];
    if (/[A-Za-z0-9_$]/.test(before) || /[A-Za-z0-9_$]/.test(after)) continue;
    return m.index;
  }
  return -1;
}

/**
 * True when a call was written with an empty argument list.
 * splitTopLevel('') yields [''], so args.length is 1 even for NOW(), and
 * testing args.length === 0 would silently never match.
 */
function isZeroArg(c) {
  return c.argStr.trim() === '';
}

/** MySQL DATE_FORMAT pattern -> PostgreSQL to_char pattern. */
function mysqlFmtToPg(fmt) {
  const body = fmt.slice(1, -1);
  let out = '';
  let i = 0;
  while (i < body.length) {
    if (body[i] !== '%') { out += body[i]; i++; continue; }
    i++;
    if (i >= body.length) { out += '%'; break; }
    // modifiers: - (no pad) _ (space pad) 0 (zero pad)
    const mods = '';
    while (i < body.length && '-_0'.includes(body[i])) mods += body[i++];
    const c = body[i++];
    const noPad = mods.includes('-');
    const padSpace = mods.includes('_');
    const fm = noPad || padSpace ? 'FM' : '';
    const map = {
      Y: 'YYYY', y: 'YY', m: 'MM', c: 'MM', d: 'DD', e: 'DD',
      H: 'HH24', k: 'HH24', h: 'HH12', I: 'HH12', l: 'HH12',
      i: 'MI', s: 'SS', S: 'SS', f: 'US', p: 'AM', r: 'HH12:MI:SS AM',
      M: 'Month', b: 'Mon', W: 'Day', a: 'Dy', D: 'Day', j: 'DDD',
      U: 'WW', u: 'WW', V: 'IYYY', v: 'IYYY', X: 'IYYY', x: 'IYYY',
      T: 'HH24:MI:SS',
    };
    if (c === '%') { out += '%'; continue; }
    const t = map[c];
    if (t === undefined) { out += fm + c; continue; }
    out += fm + t;
  }
  return "'" + out.replace(/'/g, "''") + "'";
}

// ---------------------------------------------------------------------------
// MySQL function -> PostgreSQL
// ---------------------------------------------------------------------------

const INTERVAL_UNIT = {
  MICROSECOND: 'microsecond', SECOND: 'second', MINUTE: 'minute', HOUR: 'hour',
  DAY: 'day', WEEK: 'week', MONTH: 'month', QUARTER: 'quarter', YEAR: 'year',
};

/**
 * Convert MySQL-only scalar/date functions to PostgreSQL equivalents.
 * Order matters: the compound forms must be handled before the bare `DATE()`.
 */
function convertFunctions(sql) {
  // --- DATE_SUB / DATE_ADD / ADDDATE / SUBDATE  (before generic DATE_*) ---
  sql = replaceAllCalls(sql, 'DATE_SUB', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `(${a[0]}) - ${intervalLiteral(a[1])}`;
  });
  sql = replaceAllCalls(sql, 'SUBDATE', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `(${a[0]}) - ${intervalLiteral(a[1])}`;
  });
  sql = replaceAllCalls(sql, 'DATE_ADD', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `(${a[0]}) + ${intervalLiteral(a[1])}`;
  });
  sql = replaceAllCalls(sql, 'ADDDATE', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `(${a[0]}) + ${intervalLiteral(a[1])}`;
  });

  // --- DATE_FORMAT(col, fmt) -> TO_CHAR(col, pgfmt) ---
  sql = replaceAllCalls(sql, 'DATE_FORMAT', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    const fmtLit = /^'([\s\S]*)'$/.exec(a[1]);
    if (!fmtLit) return null;
    return `to_char(${a[0]}, ${mysqlFmtToPg(a[1])})`;
  });
  sql = replaceAllCalls(sql, 'TIME_FORMAT', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    const fmtLit = /^'([\s\S]*)'$/.exec(a[1]);
    if (!fmtLit) return null;
    return `to_char(${a[0]}, ${mysqlFmtToPg(a[1])})`;
  });

  // --- CURDATE / CURTIME / NOW ---
  sql = replaceAllCalls(sql, 'CURDATE', () => 'CURRENT_DATE');
  sql = replaceAllCalls(sql, 'CURTIME', () => 'CURRENT_TIME');
  // The columns in this schema are timezone-naive `timestamp`, matching MySQL's
  // DATETIME under a pinned session timezone, so the naive clock is the
  // type-consistent equivalent of MySQL's NOW().
  sql = replaceAllCalls(sql, 'NOW', (c) => (isZeroArg(c) ? 'LOCALTIMESTAMP' : null));
  sql = replaceAllCalls(sql, 'UTC_TIMESTAMP', () => '(CURRENT_TIMESTAMP AT TIME ZONE \'UTC\')');
  sql = replaceAllCalls(sql, 'SYSDATE', () => 'LOCALTIMESTAMP');

  // --- TIMESTAMPDIFF(UNIT, a, b) ---
  sql = replaceAllCalls(sql, 'TIMESTAMPDIFF', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 3) return null;
    const unit = a[0].toUpperCase();
    const x = a[1], y = a[2];
    if (unit === 'DAY') return `((${y})::date - (${x})::date)`;
    if (unit === 'WEEK') return `((${y})::date - (${x})::date) / 7`;
    if (unit === 'MONTH') return `(EXTRACT(YEAR FROM (${y})::date) * 12 + EXTRACT(MONTH FROM (${y})::date)) - (EXTRACT(YEAR FROM (${x})::date) * 12 + EXTRACT(MONTH FROM (${x})::date))`;
    if (unit === 'YEAR') return `(EXTRACT(YEAR FROM (${y})::date) - EXTRACT(YEAR FROM (${x})::date))`;
    const div = { SECOND: 1, MINUTE: 60, HOUR: 3600, MICROSECOND: 1000000 }[unit];
    if (div === undefined) return null;
    return `(EXTRACT(EPOCH FROM ((${y})::timestamp - (${x})::timestamp)) / ${div})`;
  });

  // --- DATEDIFF(a, b) -> whole days from a to b ---
  sql = replaceAllCalls(sql, 'DATEDIFF', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `((${a[0]})::date - (${a[1]})::date)`;
  });

  // --- extraction units: YEAR(x) -> EXTRACT(YEAR FROM x) ---
  for (const [fn, part] of [['YEAR', 'YEAR'], ['MONTH', 'MONTH'], ['DAY', 'DAY'],
    ['DAYOFMONTH', 'DAY'], ['HOUR', 'HOUR'], ['MINUTE', 'MINUTE'], ['SECOND', 'SECOND'],
    ['WEEK', 'WEEK'], ['QUARTER', 'QUARTER'], ['DAYOFWEEK', 'DOW'], ['DAYOFYEAR', 'DOY']]) {
    // only when used as a function of exactly one argument
    sql = replaceAllCalls(sql, fn, (c) => {
      const a = c.args.map(s => s.trim());
      if (a.length !== 1) return null;
      if (/\bFROM\b/i.test(a[0]) && /^date\b/i.test(a[0])) return null;
      return `EXTRACT(${part} FROM ${a[0]})`;
    });
  }

  // --- UNIX_TIMESTAMP([x]) ---
  sql = replaceAllCalls(sql, 'UNIX_TIMESTAMP', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length === 0) return 'EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)';
    if (a.length === 1) return `EXTRACT(EPOCH FROM (${a[0]}))`;
    return null;
  });
  sql = replaceAllCalls(sql, 'FROM_UNIXTIME', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length === 1) return `to_timestamp(${a[0]})`;
    if (a.length === 2) {
      const f = /^'([\s\S]*)'$/.exec(a[1]);
      if (!f) return null;
      return `to_timestamp(${a[0]}, ${mysqlFmtToPg(a[1])})`;
    }
    return null;
  });

  // --- JSON ---
  // JSON_UNQUOTE(JSON_EXTRACT(c, p)) -> c ->> path ;  JSON_EXTRACT(c,p) -> c -> path
  sql = replaceAllCalls(sql, 'JSON_UNQUOTE', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 1) return null;
    const inner = findCall(a[0], 'JSON_EXTRACT');
    if (!inner || inner.start !== 0) return `(${a[0]})::text`;
    const ia = inner.args.map(s => s.trim());
    if (ia.length !== 2) return `(${a[0]})::text`;
    return `(${ia[0]}) ->> ${pgJsonPath(ia[1])}`;
  });
  sql = replaceAllCalls(sql, 'JSON_EXTRACT', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `(${a[0]}) -> ${pgJsonPath(a[1])}`;
  });
  // JSON_OBJECT/JSON_ARRAY/JSON_CONTAINS/... have no single-call rewrite that is
  // safe to do mechanically (jsonb_build_object needs key/value pairing, and the
  // others need SQL-standard path syntax).  They are reported by the auditor
  // instead of being silently mangled here.
  sql = replaceAllCalls(sql, 'JSON_UNQUOTE', (c) => {
    const a = c.args.map(s => s.trim());
    return a.length === 1 ? `(${a[0]})::text` : null;
  });

  // --- null handling ---
  sql = replaceAllCalls(sql, 'IFNULL', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `COALESCE(${a[0]}, ${a[1]})`;
  });
  sql = replaceAllCalls(sql, 'ISNULL', (c) => {
    const a = c.args.map(s => s.trim());
    return a.length === 1 ? `(${a[0]} IS NULL)` : null;
  });

  // --- IF(cond, a, b) -> CASE WHEN cond THEN a ELSE b END ---
  sql = replaceAllCalls(sql, 'IF', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 3) return null;
    return `CASE WHEN (${a[0]}) THEN (${a[1]}) ELSE (${a[2]}) END`;
  });

  // --- GROUP_CONCAT([DISTINCT] expr [ORDER BY expr] [SEPARATOR str])
  //     -> string_agg(expr::text, sep [ORDER BY expr])
  sql = replaceAllCalls(sql, 'GROUP_CONCAT', (c) => {
    const raw = c.argStr.trim();
    if (!raw) return null;

    let s = raw;
    let distinct = false;
    const dm = /^DISTINCT\s+/i.exec(s);
    if (dm) { distinct = true; s = s.slice(dm[0].length); }

    let sep = "', '";
    let orderBy = null;
    // ORDER BY runs to the end unless SEPARATOR follows it.
    const sepIdx = findTopLevelKeyword(s, 'SEPARATOR');
    let orderSrc = sepIdx >= 0 ? s.slice(0, sepIdx) : s;
    if (sepIdx >= 0) {
      const sepRaw = s.slice(sepIdx + 'SEPARATOR'.length).trim();
      const lit2 = /^'((?:[^']|'')*)'$/.exec(sepRaw);
      if (!lit2) return null;                       // dynamic separator: not safe
      sep = "'" + lit2[1].replace(/'/g, "''") + "'";
    }
    const om = findTopLevelKeyword(orderSrc, 'ORDER BY');
    if (om >= 0) {
      orderBy = orderSrc.slice(om + 'ORDER BY'.length).trim();
      orderSrc = orderSrc.slice(0, om);
    }
    const value = orderSrc.trim();
    if (!value) return null;
    // With DISTINCT, PostgreSQL requires the ORDER BY expression to match the
    // aggregated argument, so both are cast; that makes ordering textual, which
    // matches MySQL for the string values GROUP_CONCAT is used on here.
    if (distinct) {
      return `string_agg(DISTINCT ${value}::text, ${sep}`
        + (orderBy ? ` ORDER BY ${orderBy}::text` : '') + ')';
    }
    return `string_agg(${value}::text, ${sep}`
      + (orderBy ? ` ORDER BY ${orderBy}` : '') + ')';
  });

  // --- CONCAT(a, b, ...) -> a::text || b::text || ... ---
  // MySQL CONCAT yields NULL if any argument is NULL; `||` propagates NULL the
  // same way, so the semantics carry over exactly.
  sql = replaceAllCalls(sql, 'CONCAT_WS', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length < 2) return null;
    return `concat_ws(${a[0]}, ${a.slice(1).map(txt).join(', ')})`;
  });
  sql = replaceAllCalls(sql, 'CONCAT', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length === 0) return "''";
    if (a.length === 1) return txt(a[0]);
    return `(${a.map(txt).join(' || ')})`;
  });

  // --- strings ---
  sql = replaceAllCalls(sql, 'SUBSTRING', (c) => subString(c));
  sql = replaceAllCalls(sql, 'SUBSTR', (c) => subString(c));
  sql = replaceAllCalls(sql, 'MID', (c) => subString(c));
  sql = replaceAllCalls(sql, 'LOCATE', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length === 2) return `strpos(${a[1]}, ${a[0]})`;
    if (a.length === 3) return `position(${a[0]} in ${a[1]})`;
    return null;
  });
  sql = replaceAllCalls(sql, 'INSTR', (c) => {
    const a = c.args.map(s => s.trim());
    return a.length === 2 ? `strpos(${a[1]}, ${a[0]})` : null;
  });
  sql = replaceAllCalls(sql, 'LPAD', (c) => lpad(c));
  sql = replaceAllCalls(sql, 'RPAD', (c) => lpad(c));
  sql = replaceAllCalls(sql, 'REVERSE', (c) => {
    const a = c.args.map(s => s.trim());
    return a.length === 1 ? `reverse(${a[0]})` : null;
  });

  // --- FIELD(a, b, c, ...) -> array_position(ARRAY[b,c,...], a) ---
  sql = replaceAllCalls(sql, 'FIELD', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length < 2) return null;
    return `array_position(ARRAY[${a.slice(1).map(txt).join(', ')}], ${a[0]})`;
  });
  sql = replaceAllCalls(sql, 'FIND_IN_SET', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 2) return null;
    return `array_position(string_to_array(${a[1]}, ','), ${a[0]})`;
  });

  // --- misc ---
  sql = replaceAllCalls(sql, 'UUID', (c) => (isZeroArg(c) ? 'gen_random_uuid()' : null));
  sql = replaceAllCalls(sql, 'RAND', (c) => (isZeroArg(c) ? 'RANDOM()' : null));
  sql = replaceAllCalls(sql, 'POW', (c) => {
    const a = c.args.map(s => s.trim());
    return a.length === 2 ? `power(${a[0]}, ${a[1]})` : null;
  });
  sql = replaceAllCalls(sql, 'LOG', (c) => {
    const a = c.args.map(s => s.trim());
    return a.length === 1 ? `ln(${a[0]})` : (a.length === 2 ? `log(${a[1]}, ${a[0]})` : null);
  });
  sql = replaceAllCalls(sql, 'DATABASE', () => 'current_database()');
  sql = replaceAllCalls(sql, 'USER', () => 'current_user');
  sql = replaceAllCalls(sql, 'VERSION', () => "current_setting('server_version')");
  sql = replaceAllCalls(sql, 'LAST_DAY', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length === 1) return `(date_trunc('month', (${a[0]})::date) + interval '1 month')::date - interval '1 day'`;
    return null;
  });

  // --- bare DATE(expr) must come last ---
  sql = replaceAllCalls(sql, 'DATE', (c) => {
    const a = c.args.map(s => s.trim());
    if (a.length !== 1) return null;
    if (/^\s*'?%/.test(a[0])) return null;      // DATE_FORMAT remnant
    if (/^(CURRENT_DATE|CURRENT_TIMESTAMP|NOW\s*\(\s*\))$/i.test(a[0])) return `(${a[0]})::date`;
    return `(${a[0]})::date`;
  });

  return sql;
}

function txt(e) {
  const t = e.trim();
  if (/^\(/.test(t) && matchParen(t, 0) === t.length - 1) return t;
  if (/^-?\d+(\.\d+)?$/.test(t)) return `${t}::text`;
  if (/^'[\s\S]*'$/.test(t)) return t;
  return `${t}::text`;
}

function subString(c) {
  const a = c.args.map(s => s.trim());
  // MySQL/PG share the FROM/FOR form; only the comma form needs rewriting.
  if (a.length === 1) return `substring(${a[0]})`;
  if (a.length === 2) return `substring(${a[0]} FROM ${a[1]})`;
  if (a.length === 3) return `substring(${a[0]} FROM ${a[1]} FOR ${a[2]})`;
  return null;
}

function lpad(c) {
  const a = c.args.map(s => s.trim());
  if (a.length === 3) return `lpad(${a[0]}, ${a[1]}, ${a[2]})`;
  if (a.length === 2) return `lpad(${a[0]}, ${a[1]}, ' ')`;
  return null;
}

/** '$.a.b' -> '{a,b}' */
function pgJsonPath(p) {
  const m = /^\s*'([^']*)'\s*$/.exec(p);
  if (!m) return null;
  let path = m[1];
  if (path === '$') return "'{}'";
  if (path.startsWith('$')) path = path.slice(1);
  const parts = path.replace(/\[(\d+)\]/g, '$1').split('.').filter(s => s.length);
  if (!parts.length) return "'{}'";
  return "'{" + parts.join(',') + "}'";
}

/** 'INTERVAL 7 DAY' | 'INTERVAL ${n} MONTH' | 'INTERVAL \'1\' DAY' -> "INTERVAL '7 days'" */
function intervalLiteral(expr) {
  const s = expr.trim();
  const m = /^INTERVAL\s+(.+?)\s+([A-Za-z]+)$/is.exec(s);
  if (!m) return s;
  const q = m[1].trim();
  const rawUnit = m[2].toUpperCase();
  const unit = INTERVAL_UNIT[rawUnit];
  if (!unit) return s;
  const value = /^'[\s\S]*'$/.test(q) ? q.slice(1, -1) : q;
  // PostgreSQL has no quarter interval, so scale to months instead.
  if (rawUnit === 'QUARTER') return `(${value}) * INTERVAL '3 months'`;
  // PostgreSQL accepts "1 day" and "7 days"; emit the natural plural.
  const suffix = /^\s*1\s*$/.test(value) ? '' : 's';
  return `INTERVAL '${value} ${unit}${suffix}'`;
}

module.exports = {
  convertFunctions, mysqlFmtToPg, findCall, replaceAllCalls, isZeroArg, findTopLevelKeyword,
  intervalLiteral, pgJsonPath, txt,
};
