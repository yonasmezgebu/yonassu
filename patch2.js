const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/finance/FinanceEV.jsx', 'utf8');

content = content.replace(
  /const \[statusCount, setStatusCount\] = useState\(0\);/,
  "const [statusCount, setStatusCount] = useState(0);\n  const [companyAccounts, setCompanyAccounts] = useState([]);\n\n  useEffect(() => {\n    api.get('/finance-bank').then(res => setCompanyAccounts(res.data || [])).catch(console.error);\n  }, []);"
);

content = content.replace(
  /{paymentMethod === 'Bank' && \([\s\S]*?<h4 style={{ margin: '0 0 16px', fontSize: 14, color: 'var\(--color-text-primary\)', fontWeight: 600 }}>Bank Details<\/h4>/,
  `{paymentMethod === 'Bank' && (
                <div style={{ background: '#F9FAFB', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>Bank Details</h4>
                    <select className="form-input" style={{ width: 250 }} onChange={e => {
                      const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                      if (acc) { setBankName(acc.bank_provider || ''); setAccountHolder('Sutana Enterprise'); setAccountNumber(acc.account_number || ''); }
                    }}><option value="">Select Company Bank Account...</option>{companyAccounts.filter(a => a.account_type === 'Bank').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                  </div>`
);

content = content.replace(
  /{paymentMethod === 'Telebirr' && \([\s\S]*?<h4 style={{ margin: '0 0 16px', fontSize: 14, color: 'var\(--color-text-primary\)', fontWeight: 600 }}>Telebirr Details<\/h4>/,
  `{paymentMethod === 'Telebirr' && (
                <div style={{ background: '#F9FAFB', padding: 20, border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>Telebirr Details</h4>
                    <select className="form-input" style={{ width: 250 }} onChange={e => {
                      const acc = companyAccounts.find(a => a.id.toString() === e.target.value);
                      if (acc) { setTelebirrNumber(acc.account_number || ''); setTelebirrName(acc.account_name || 'Sutana Enterprise'); }
                    }}><option value="">Select Company Telebirr...</option>{companyAccounts.filter(a => a.account_type === 'Mobile Wallet').map(a => <option key={a.id} value={a.id}>{a.account_name} - {a.account_number}</option>)}</select>
                  </div>`
);

fs.writeFileSync('frontend/src/pages/finance/FinanceEV.jsx', content);
console.log('Done');
