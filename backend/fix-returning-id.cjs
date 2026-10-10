/**
 * fix-returning-id.cjs
 * Adds .returning('id') to every knex .insert({...}) whose return value is
 * destructured as `const [x] = await db(...).insert(...)` or
 * `const [x] = await trx(...).insert(...)`.
 *
 * Also normalises the use of the returned value from an object {id:N} to a
 * plain number by injecting `const resolvedX = (x && x.id !== undefined) ? x.id : x;`
 * right after — but ONLY when the variable name is subsequently used.
 *
 * Safe to re-run: skips lines that already have .returning().
 */
const fs = require('fs');
const path = require('path');

const CONTROLLERS_DIR = path.join(__dirname, 'src/api/controllers');

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match `const [varName] = await db/trx('table').insert({`
    // The insert may span multiple lines so we look for the closing `});` below.
    const insertStart = /^\s*const \[(\w+)\]\s*=\s*await\s+(db|trx)\(/.test(line) &&
                        line.includes('.insert(') &&
                        !line.includes('.returning(');

    if (!insertStart) continue;

    // Find where the insert expression closes (the `});` line)
    let closeIdx = -1;
    let depth = 0;
    let inInsert = false;
    for (let j = i; j < Math.min(i + 60, lines.length); j++) {
      for (const ch of lines[j]) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }
      if (lines[j].includes('.insert(')) inInsert = true;
      if (inInsert && depth === 0) { closeIdx = j; break; }
    }

    if (closeIdx === -1) continue;

    // Check if .returning('id') is already present anywhere in this block
    const block = lines.slice(i, closeIdx + 1).join('\n');
    if (block.includes('.returning(')) continue;

    // Append .returning('id') to the closing line
    lines[closeIdx] = lines[closeIdx].replace(/\)\s*;?\s*$/, ').returning(\'id\');');
    
    // Extract the variable name
    const varMatch = line.match(/const \[(\w+)\]\s*=/);
    if (!varMatch) continue;
    const varName = varMatch[1];

    // Insert a normalisation line after the closing line
    const indent = lines[closeIdx].match(/^(\s*)/)[1];
    const normalise = `${indent}const _${varName}Resolved = (${varName} && ${varName}.id !== undefined) ? ${varName}.id : ${varName}; // pg returning fix`;
    lines.splice(closeIdx + 1, 0, normalise);

    // Replace all subsequent uses of varName (not within another declaration) with _${varName}Resolved
    // Only within the same function — stop at the next function boundary
    for (let k = closeIdx + 2; k < lines.length; k++) {
      if (/^\s*(exports\.|const |async function |function )/.test(lines[k])) break;
      // Replace standalone uses (not `const [varName]` patterns)
      if (lines[k].includes(varName) && !lines[k].includes(`const [${varName}]`) && !lines[k].includes(`_${varName}Resolved`)) {
        // Use word-boundary-like replacement
        lines[k] = lines[k].replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}Resolved`);
      }
    }

    changed = true;
    i = closeIdx + 1; // skip ahead past the inserted line
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return true;
  }
  return false;
}

const files = fs.readdirSync(CONTROLLERS_DIR).filter(f => f.endsWith('.js'));
let fixedCount = 0;
for (const file of files) {
  const filePath = path.join(CONTROLLERS_DIR, file);
  if (processFile(filePath)) {
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
}
console.log(`\nDone. Fixed ${fixedCount} files out of ${files.length} total.`);
