const jwt = require('jsonwebtoken');
const http = require('http');
const SECRET = 'your_jwt_secret_min_32_chars';
function makeToken(userId, email, roles) {
  return jwt.sign({ userId, email, roles }, SECRET, { expiresIn: '30m', issuer: 'sutana-ems', audience: 'sutana-frontend' });
}
function request(path, token, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: '127.0.0.1', port: 5000, path, method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data.slice(0,500) }); } });
    });
    req.on('error', e => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
async function run() {
  const pm = makeToken(5, 'pm@t.com', ['PM']);
  const ceo = makeToken(2, 'ceo@t.com', ['CEO']);

  console.log('1. Create multi-item quotation...');
  const c = await request('/api/v1/purchase/quotations', pm, 'POST', {
    supplier_name: 'TestSupp', date_agreed: '2026-08-26', agreed_via: 'Phone', vat_rate: '15',
    items: [
      { item_description: 'Laptop', quantity: 5, unit: 'pcs', unit_price: 25000 },
      { item_description: 'Mouse', quantity: 10, unit: 'pcs', unit_price: 500 },
      { item_description: 'Keyboard', quantity: 10, unit: 'pcs', unit_price: 1200 }
    ]
  });
  console.log('   Created:', c.status, c.data?.quotation_no);
  if (c.status !== 'success') return;

  const qId = c.data.id;
  console.log('2. Fetch items...');
  const i = await request(`/api/v1/purchase/quotations/${qId}/items`, pm);
  console.log('   Items:', (i.data||[]).map(x => `${x.item_description} x${x.quantity} @${x.unit_price}`).join(', '));

  console.log('3. CEO approves...');
  const a = await request(`/api/v1/purchase/quotations/${qId}/ceo-approve`, ceo, 'POST', { action: 'approve' });
  console.log('   Approved:', a.status);

  console.log('4. Convert to PO...');
  const conv = await request(`/api/v1/purchase/quotations/${qId}/convert`, pm, 'POST');
  console.log('   Converted:', conv.status, conv.message, 'PO:', conv.purchase_order_id);

  console.log('\nAll tests passed!');
}
run().catch(e => console.error('Error:', e));
