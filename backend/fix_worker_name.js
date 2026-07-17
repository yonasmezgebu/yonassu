const fs = require('fs');
const f = 'D:/SUTANA/frontend/src/pages/pharmacy/PharmacySalesForm.jsx';
let c = fs.readFileSync(f, 'utf8');

// Note: 15 spaces of indentation (not 16)
const oldStr = `<input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}\r\n                                 placeholder="Your name" style={inputStyle()} />`;

const newStr = `{autoFilledWorker ? (
                                 <div>
                                   <input type="text" value={workerName} readOnly
                                     style={{ ...inputStyle(), background: '#f0fdf4', border: '1.5px solid #4ade80', color: '#166534', fontWeight: 600 }} />
                                   <div style={{ fontSize: 11, color: '#15803d', marginTop: 3 }}>&#10003; Auto-filled {autoFilledWorker.sub_role ? \`(\${autoFilledWorker.sub_role})\` : ''}</div>
                                 </div>
                               ) : (
                                 <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)}
                                   placeholder="Select a branch to auto-fill" style={inputStyle()} />
                               )}`;

const count = c.split(oldStr).length - 1;
console.log('Occurrences found:', count);
c = c.split(oldStr).join(newStr);
fs.writeFileSync(f, c, 'utf8');
console.log('Done - replaced', count, 'occurrences');
