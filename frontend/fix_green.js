const fs = require('fs');
let code = fs.readFileSync('src/pages/pharmacy/StoreInventoryView.jsx', 'utf8');

// 1. Restore Color Palette to plant theme
code = code.replace(/const CYAN   = '#F8FAFC'; \/\/ slate-50/g, "const CYAN   = '#d1fae5'; // emerald-100");
code = code.replace(/const PURPLE = '#FFFFFF'; \/\/ white/g, "const PURPLE = '#a7f3d0'; // emerald-200");
code = code.replace(/const DARK   = '#0F172A'; \/\/ slate-900/g, "const DARK   = '#064e3b'; // emerald-900");
code = code.replace(/const MID    = '#64748B'; \/\/ slate-500/g, "const MID    = '#047857'; // emerald-600");
code = code.replace(/const ACCENT = '#10B981'; \/\/ emerald-500/g, "const ACCENT = '#10b981'; // emerald-500");

// 2. Restore Borders
code = code.replace(/border:`1px solid #E2E8F0`/g, "border:`3px solid ${DARK}`");
code = code.replace(/border: `1px solid #E2E8F0`/g, "border: `3px solid ${DARK}`");
code = code.replace(/border: '1px solid #E2E8F0'/g, "border: `3px solid ${DARK}`");
code = code.replace(/borderBottom:`1px solid #E2E8F0`/g, "borderBottom:`3px solid ${DARK}`");

// 3. Restore Box Shadows
code = code.replace(/boxShadow:`0 4px 6px rgba\(0,0,0,0\.05\)`/g, "boxShadow:`4px 4px 0 ${DARK}`");
code = code.replace(/boxShadow: `0 4px 6px rgba\(0,0,0,0\.05\)`/g, "boxShadow: `4px 4px 0 ${DARK}`");
code = code.replace(/boxShadow:`0 2px 4px rgba\(0,0,0,0\.05\)`/g, "boxShadow:`4px 4px 0 ${DARK}`");
code = code.replace(/boxShadow: `0 2px 4px rgba\(0,0,0,0\.05\)`/g, "boxShadow: `4px 4px 0 ${DARK}`");
code = code.replace(/boxShadow:`0 4px 12px rgba\(0,0,0,0\.1\)`/g, "boxShadow:`6px 6px 0 ${DARK}`");

// 4. Restore CSS Style block
code = code.replace(/\/\* Button 3-D lift \*\/[\s\S]*?\/\* Row \/ Card 3-D hover \*\//g, `/* Button 3-D lift */
        .btn3d {
          transition: transform .15s cubic-bezier(.4,0,.2,1), box-shadow .15s cubic-bezier(.4,0,.2,1);
          transform-style: preserve-3d;
        }
        .btn3d:hover:not(:disabled) {
          transform: perspective(500px) translateZ(12px) translateY(-4px) rotateX(6deg) !important;
          box-shadow: 0 10px 0 \${DARK}, 0 14px 20px rgba(0,0,0,.25) !important;
        }
        .btn3d:active:not(:disabled) {
          filter: brightness(0.9);
          box-shadow: 1px 1px 0 \${DARK} !important;
        }

        /* Row / Card 3-D hover */`);

code = code.replace(/\/\* Row \/ Card 3-D hover \*\/[\s\S]*?<\/style>/g, `/* Row / Card 3-D hover */
        .row3d, .card3d {
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
          transform-style: preserve-3d;
        }
        .row3d:hover {
          transform: perspective(900px) scale(1.006) translateZ(7px);
          box-shadow: 0 8px 22px rgba(0,0,0,.13);
          z-index: 5;
          position: relative;
          background: white !important;
        }
        .card3d:hover {
          transform: perspective(900px) scale(1.01) translateZ(10px);
          box-shadow: 0 12px 24px rgba(0,0,0,.15), 6px 6px 0 \${DARK};
          z-index: 5;
        }

        .icon3d  { animation: blink3D 3.2s ease-in-out infinite; display:inline-block; }
        .iconPop { animation: iconPop  2.5s ease-in-out infinite; display:inline-block; }
        .badge3d { animation: badgePop 2.8s ease-in-out infinite; display:inline-block; }
      }</style>`);

fs.writeFileSync('src/pages/pharmacy/StoreInventoryView.jsx', code);
console.log('Done!');
