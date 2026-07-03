const fs = require('fs');
const path = require('path');

const dirs = [
  'd:/web-app/sutaanaaaa/SUTANA-EMS/frontend/src/pages/sales',
  'd:/web-app/sutaanaaaa/SUTANA-EMS/frontend/src/pages/auth',
];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    let openBraces = 0, openParens = 0, openBrackets = 0;
    let inSingleString = false;
    let inDoubleString = false;
    let inTemplate = false;

    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const prev = i > 0 ? content[i - 1] : '';

      if (inSingleString) {
        if (ch === "'" && prev !== '\\') inSingleString = false;
        continue;
      }
      if (inDoubleString) {
        if (ch === '"' && prev !== '\\') inDoubleString = false;
        continue;
      }
      if (inTemplate) {
        if (ch === '`' && prev !== '\\') inTemplate = false;
        continue;
      }

      if (ch === "'") { inSingleString = true; continue; }
      if (ch === '"') { inDoubleString = true; continue; }
      if (ch === '`') { inTemplate = true; continue; }

      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
      else if (ch === '(') openParens++;
      else if (ch === ')') openParens--;
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets--;
    }

    const label = path.basename(dir) + '/' + file;
    if (openBraces !== 0 || openParens !== 0 || openBrackets !== 0) {
      console.log('ISSUE: ' + label + ' => braces=' + openBraces + ' parens=' + openParens + ' brackets=' + openBrackets);
    } else {
      console.log('OK:    ' + label);
    }
  });
});
