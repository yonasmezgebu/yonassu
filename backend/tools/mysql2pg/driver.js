'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const { convertSql } = require('./convert');

const RAW_METHODS = new Set(['raw', 'whereRaw', 'havingRaw', 'orderByRaw', 'joinRaw', 'selectRaw']);
const PLACEHOLDER = '\u0001';
const PKG = path.resolve(__dirname, '..', '..', 'package.json');

function walkDir(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walkDir(p, out);
    } else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function parse(src, file) {
  return parser.parse(src, {
    sourceType: 'unambiguous',
    errorRecovery: true,
    plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport', 'topLevelAwait', 'objectRestSpread'],
  });
}

/**
 * Collect every *Raw(...) call site whose arguments are SQL.
 * @returns {Array<{file:string,line:number,args:Array,kind:string}>}
 */
function findRawSites(src) {
  const ast = parse(src);
  const sites = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (typeof node.type !== 'string') return;

    if (node.type === 'CallExpression' && node.callee) {
      const c = node.callee;
      let name = null;
      if (c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier') name = c.property.name;
      else if (c.type === 'Identifier') name = c.name;
      if (name && RAW_METHODS.has(name)) {
        // The first argument is SQL; later arguments are bindings.
        const sqlArgs = [];
        for (const a of node.arguments) {
          if (a.type === 'TemplateLiteral' || a.type === 'StringLiteral') sqlArgs.push(a);
          else break;
        }
        if (sqlArgs.length) sites.push({ node, sqlArgs, name });
      }
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k.endsWith('Comments')) continue;
      visit(node[k]);
    }
  };
  visit(ast);
  return sites;
}

/**
 * Rewrite one SQL-bearing node.
 *
 * Template literals are handled segment-wise.  The static chunks are taken in
 * *cooked* (unescaped) form and joined with placeholders standing in for the
 * `${...}` expressions, so the converter sees ordinary SQL and patterns may
 * span an interpolation - e.g. `DATE_SUB(NOW(), INTERVAL ${days} DAY)`.
 * The combined text is converted as a whole, escaped back into template-literal
 * form, and only then are the original expression sources spliced back in.  The
 * JS expressions themselves are never inspected or modified.
 */
function rewriteNode(node, src, ctx) {
  if (node.type === 'StringLiteral') {
    const converted = convertSql(node.value, ctx);
    if (converted.length === 1 && converted[0] === node.value) return null;
    return { start: node.start, end: node.end, text: jsQuote(converted[0]) };
  }

  const exprSrc = node.expressions.map(e => src.slice(e.start, e.end));
  let combined = '';
  for (let i = 0; i < node.quasis.length; i++) {
    combined += node.quasis[i].value.cooked;
    if (i < exprSrc.length) combined += `${PLACEHOLDER}${i}${PLACEHOLDER}`;
  }

  const converted = convertSql(combined, ctx);
  // DDL conversions already terminate each statement; joining with a raw ';'
  // would double them up.
  let body = converted.map(s => s.replace(/;\s*$/, '')).join(';\n');
  if (body === combined) return null;

  // Escape first, then re-insert the interpolations, so escapeTemplate cannot
  // turn a live `${...}` into a literal `\${...}`.
  let text = escapeTemplate(body);
  for (let i = 0; i < exprSrc.length; i++) {
    text = text.split(`${PLACEHOLDER}${i}${PLACEHOLDER}`).join('${' + exprSrc[i] + '}');
  }
  return { start: node.start, end: node.end, text: '`' + text + '`' };
}

/** Escape a cooked SQL string for use as template-literal content. */
function escapeTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/** Quote a cooked SQL string as a JS single-quoted string literal. */
function jsQuote(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
}

/**
 * Convert every SQL literal in one file.
 * @returns {{changed:boolean, edits:number, warnings:string[], stmts:string[]}}
 */
function convertFile(file, opts = {}) {
  const src = fs.readFileSync(file, 'utf8');
  const warnings = [];
  const ctx = { indexNames: opts.indexNames || new Set(), warnings, table: opts.table };
  const interpSites = [];
  let sites;
  try { sites = findRawSites(src); }
  catch (e) { return { changed: false, edits: 0, warnings: [`parse error: ${e.message}`], stmts: [], src, interpolations: 0 }; }

  const edits = [];
  const stmts = [];
  for (const site of sites) {
    for (const arg of site.sqlArgs) {
      let r;
      try { r = rewriteNode(arg, src, ctx); }
      catch (e) { warnings.push(`convert error at line ${arg.loc.start.line}: ${e.message}`); continue; }
      if (r) {
        edits.push(r);
        // The Knex method decides what kind of SQL this is, which the validator
        // needs: a whereRaw argument and an orderByRaw argument are both
        // "expressions", but only one of them parses inside a bare SELECT.
        stmts.push({ line: arg.loc.start.line, text: r.text, method: site.name });
        // A surviving ${...} is a JS expression spliced into the SQL at run
        // time.  It is preserved on purpose, but it is also the one place a
        // MySQL-ism can hide from both the converter and the validator, so the
        // sites are counted and listed for review.
        if (arg.expressions && arg.expressions.length) {
          ctx.interpolations = (ctx.interpolations || 0) + arg.expressions.length;
          interpSites.push({ line: arg.loc.start.line, method: site.name, count: arg.expressions.length });
        }
      }
    }
  }
  if (!edits.length) {
    return { changed: false, edits: 0, warnings, stmts, src, interpolations: ctx.interpolations || 0, interpSites };
  }

  // apply from the end so offsets stay valid
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return {
    changed: true, edits: edits.length, warnings, stmts, src: out,
    interpolations: ctx.interpolations || 0, interpSites,
  };
}

module.exports = { convertFile, findRawSites, walkDir, rewriteNode, parse, RAW_METHODS, escapeTemplate, jsQuote, PKG };
