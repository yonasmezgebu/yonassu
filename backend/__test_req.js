const http = require('http');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImVtYWlsIjoiYWRtaW5AZW1haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzUxOTQ5NTYwLCJleHAiOjE3NTE5NTMxNjB9.cOFPJ1rSEBMF0_izIX4hAphNnvzrM-ft0YBE1tFPQ80';
const data = JSON.stringify({
  from_branch_id: 1,
  to_branch_id: 2,
  drug_id: 1,
  quantity: 10
});
const req = http.request({
  hostname: 'localhost', port: 5000, method: 'POST',
  path: '/api/v1/pharmacy/transfers/branch-to-branch',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length, 'Authorization': `Bearer ${token}` }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
    process.exit(0);
  });
});
req.write(data);
req.end();
