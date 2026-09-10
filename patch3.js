const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/finance/FinanceCRV.jsx', 'utf8');

content = content.replace(
  /const \[crvList, setCrvList\]       = useState\(\[\]\);/,
  "const [crvList, setCrvList]       = useState([]);\n  const [companyAccounts, setCompanyAccounts] = useState([]);\n\n  useEffect(() => {\n    api.get('/finance-bank').then(res => setCompanyAccounts(res.data || [])).catch(console.error);\n  }, []);"
);

content = content.replace(
  /{paymentMethod === 'Bank' && \([\s\S]*?<h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details<\/h4>/,
  `{paymentMethod === 'Bank' && (
              <div style={{ background: '#f0f9ff', padding: 20, borderRadius: 10, border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: '#0369a1', fontWeight: 700 }}>Bank Details</h4>
                  <select className="form-input" style={{ width: 250, padding: '8px 12px', border: '1px solid #7dd3fc', borderRadius: 8, fontSize: 13 }} onChange={e => {
                    const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                    if (acc) { setBankName(acc.bank_provider || ''); setAccountHolder('Sutana Enterprise'); setAccountNumber(acc.account_number || ''); }
                  }}><option value="">Select Company Bank Account...</option>{companyAccounts.filter(a => a.account_type === 'Bank').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                </div>`
);

content = content.replace(
  /{paymentMethod === 'Telebirr' && \([\s\S]*?<h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details<\/h4>/,
  `{paymentMethod === 'Telebirr' && (
              <div style={{ background: '#fffbeb', padding: 20, borderRadius: 10, border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 13, color: '#b45309', fontWeight: 700 }}>Telebirr Details</h4>
                  <select className="form-input" style={{ width: 250, padding: '8px 12px', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13 }} onChange={e => {
                    const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                    if (acc) { setTelebirrNumber(acc.account_number || ''); setTelebirrName(acc.account_name || 'Sutana Enterprise'); }
                  }}><option value="">Select Company Telebirr...</option>{companyAccounts.filter(a => a.account_type === 'Mobile Wallet').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                </div>`
);

fs.writeFileSync('frontend/src/pages/finance/FinanceCRV.jsx', content);
console.log('Done CRV');
