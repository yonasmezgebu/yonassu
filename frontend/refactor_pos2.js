const fs = require('fs');
let code = fs.readFileSync('src/pages/sales/RetailPOS.jsx', 'utf8');

// 1. Full Screen Layout
const oldDiv = '<div style={{ margin: 0, padding: 0, minHeight: \\'calc(100vh - 72px)\\', background: \\'var(--bg-page)\\', width: \\'100%\\', boxSizing: \\'border-box\\', fontFamily: \"\\'Inter\\', sans-serif\" }}>';
const newDiv = '<div style={{ margin: \\'-24px\\', padding: \\'24px\\', minHeight: \\'calc(100vh - 64px)\\', background: \\'var(--bg-page)\\', width: \\'calc(100% + 48px)\\', boxSizing: \\'border-box\\', fontFamily: \"\\'Inter\\', sans-serif\" }}>';
code = code.replace(oldDiv, newDiv);

// 2. Replace alerts with toasts
code = code.replace(/alert\\('Order deleted successfully'\\);/g, \"showToast('Order deleted successfully', 'success');\");
code = code.replace(/alert\\(e\\.response\\?\\.data\\?\\.message \\|\\| 'Failed to delete order'\\);/g, \"showToast(e.response?.data?.message || 'Failed to delete order', 'error');\");

// 3. Remove all border radii inline
code = code.replace(/borderRadius:\\s*['\"]?[a-zA-Z0-9%px\\.]+['\"]?/g, \"borderRadius: 0\");

// 4. Remove all border-radius in CSS
code = code.replace(/border-radius:\\s*[^;]+;/g, \"border-radius: 0;\");

// 5. Remove fadeUp animation
code = code.replace(/@keyframes fadeUp [^{]+{[^}]+}/g, '');
code = code.replace(/animation: fadeUp[^;]+;/g, '');

// 6. Fix CSS for inputs
const inputCssOld = '        input, select, textarea {\\n          border: 2px solid var(--earth);\\n          padding: 10px;\\n          border-radius: 0;\\n          font-family: inherit;\\n          width: 100%;\\n          box-sizing: border-box;\\n          transition: border-color 0.2s;\\n        }\\n        input:focus, select:focus, textarea:focus {\\n          border-color: var(--primary);\\n          outline: none;\\n        }';
const inputCssNew = '        input, select, textarea {\\n          border: 1px solid var(--earth);\\n          padding: 10px;\\n          border-radius: 0;\\n          font-family: inherit;\\n          width: 100%;\\n          box-sizing: border-box;\\n          transition: border-color 0.2s, border-width 0.2s;\\n          background: white;\\n        }\\n        input:focus, select:focus, textarea:focus,\\n        input:not(:placeholder-shown) {\\n          border: 2px solid var(--primary);\\n          outline: none;\\n        }';
code = code.replace(inputCssOld, inputCssNew);

fs.writeFileSync('src/pages/sales/RetailPOS.jsx', code);
console.log('Refactoring complete.');
