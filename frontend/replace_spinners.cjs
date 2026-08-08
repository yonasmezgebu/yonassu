const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace <RefreshCw ... spin ... /> and <Loader2 ... spin ... /> and <RefreshCcw ... spin ... />
  const regex = /<(RefreshCw|Loader2|RefreshCcw)[^>]*spin[^>]*\/>/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, (match) => {
      // try to extract size
      let sizeMatch = match.match(/size=\{?(\d+)\}?/);
      let size = sizeMatch ? sizeMatch[1] : '16';
      return `<SegmentedSpinner size={${size}} />`;
    });
    changed = true;
  }
  
  // also replace spinning div rings
  const divRegex = /<div[^>]*animation:\s*['"]?spin[^>]*\/>/g;
  if (divRegex.test(content)) {
    content = content.replace(divRegex, (match) => {
      return `<SegmentedSpinner size={24} />`;
    });
    changed = true;
  }

  // also replace spinning span
  const spanRegex = /<span[^>]*animation:\s*refreshing \? ['"]?spin[^>]*>🔄<\/span>/g;
  if (spanRegex.test(content)) {
    content = content.replace(spanRegex, (match) => {
      return `{refreshing && <SegmentedSpinner size={16} />}`;
    });
    changed = true;
  }

  // spinning svg
  const svgRegex = /<svg[^>]*animation:\s*['"]?spin[^>]*>.*?<\/svg>/gs;
  if (svgRegex.test(content)) {
    content = content.replace(svgRegex, (match) => {
      return `<SegmentedSpinner size={18} />`;
    });
    changed = true;
  }

  if (changed) {
    // Add import if not present
    if (!content.includes('SegmentedSpinner')) {
      // Calculate relative path to src/components/ui/SegmentedSpinner
      const fromDir = path.dirname(file);
      const toDir = path.join(__dirname, 'src/components/ui/SegmentedSpinner');
      let relPath = path.relative(fromDir, toDir).replace(/\\/g, '/');
      if (!relPath.startsWith('.')) relPath = './' + relPath;
      
      content = `import SegmentedSpinner from '${relPath}';\n` + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
  }
});

console.log(`Replaced spinners in ${replacedCount} files.`);
