const fs = require('fs');
let code = fs.readFileSync('src/pages/sales/RetailPOS.jsx', 'utf8');

// 1. Full Screen Layout
code = code.replace(
  /<div style={{ margin: 0, padding: 0, minHeight: 'calc\(100vh - 72px\)', background: 'var\(--bg-page\)', width: '100%', boxSizing: 'border-box', fontFamily: \"'Inter', sans-serif\" }}>/,
  \<div style={{ margin: '-24px', padding: '24px', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-page)', width: 'calc(100% + 48px)', boxSizing: 'border-box', fontFamily: \"'Inter', sans-serif\" }}>\
);

// 2. Replace alerts with toasts
code = code.replace(/alert\('Order deleted successfully'\);/g, \"showToast('Order deleted successfully', 'success');\");
code = code.replace(/alert\\(e\\.response\\?\\.data\\?\\.message \\|\\| 'Failed to delete order'\\);/g, \"showToast(e.response?.data?.message || 'Failed to delete order', 'error');\");

// 3. Remove all border radii inline
code = code.replace(/borderRadius:\s*['"]?[a-zA-Z0-9%px\.]+['"]?/g, \"borderRadius: 0\");

// 4. Remove all border-radius in CSS
code = code.replace(/border-radius:\s*[^;]+;/g, \"border-radius: 0;\");

// 5. Remove fadeUp animation
code = code.replace(/@keyframes fadeUp [^{]+{[^}]+}/g, '');
code = code.replace(/animation: fadeUp[^;]+;/g, '');

// 6. Fix CSS for inputs
const inputCssOld = \        input, select, textarea {
          border: 2px solid var(--earth);
          padding: 10px;
          border-radius: 0;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--primary);
          outline: none;
        }\;

const inputCssNew = \        input, select, textarea {
          border: 1px solid var(--earth);
          padding: 10px;
          border-radius: 0;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, border-width 0.2s;
          background: white;
        }
        input:focus, select:focus, textarea:focus,
        input:not(:placeholder-shown) {
          border: 2px solid var(--primary);
          outline: none;
        }\;
code = code.replace(inputCssOld, inputCssNew);

fs.writeFileSync('src/pages/sales/RetailPOS.jsx', code);
console.log('Refactoring complete.');
