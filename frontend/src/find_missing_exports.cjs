const fs = require('fs'); 
const path = require('path'); 
const dir = 'D:/web-app/sutaanaaaa/SUTANA-EMS/frontend/src/pages/printing'; 
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx')); 
let imports = new Set(); 
files.forEach(f => { 
  const content = fs.readFileSync(path.join(dir, f), 'utf8'); 
  const match = content.match(/import\s+{([^}]+)}\s+from\s+['"].*?printingTransactionService['"]/g); 
  if (match) { 
    match.forEach(m => { 
      const vars = m.match(/{([^}]+)}/)[1].split(',').map(s => s.trim()); 
      vars.forEach(v => imports.add(v)); 
    }); 
  } 
}); 
const exportedContent = fs.readFileSync('D:/web-app/sutaanaaaa/SUTANA-EMS/frontend/src/utils/printingTransactionService.js', 'utf8');
const exportedMatch = exportedContent.match(/export const ([a-zA-Z0-9_]+)/g);
const exportedVars = exportedMatch.map(m => m.split(' ')[2]);

const missing = Array.from(imports).filter(i => !exportedVars.includes(i) && i !== 'printingState');
console.log('Missing exports:', missing);
