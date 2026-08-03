const fs = require('fs');
let content = fs.readFileSync('d:/SUTANA/frontend/src/pages/LandingPage/TenderDetailPage.jsx', 'utf8');

const replacements = {
  '#059669': '#2E8B57',
  '#10b981': '#2E8B57',
  '#047857': '#1B5E20',
  '#0f172a': '#424242',
  '#1e293b': '#1B5E20',
  '#475569': '#424242',
  '#64748b': '#424242',
  '#94a3b8': '#8D6E63',
  '#e2e8f0': '#8D6E63',
  '#f8fafc': '#F5F5F5',
  '#f1f5f9': '#F5F5F5',
  '#0ea5e9': '#2E8B57',
  '#f0f9ff': '#FFFFFF',
  '#f0fdf4': '#F5F5F5',
  '#bbf7d0': '#8D6E63',
  'linear-gradient(135deg,#059669,#10b981)': '#2E8B57',
  'linear-gradient(135deg,#059669,#047857)': '#2E8B57',
  'linear-gradient(135deg,#0f172a,#1e293b)': '#1B5E20',
  'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)': 'linear-gradient(90deg, #F5F5F5 25%, #FFFFFF 50%, #F5F5F5 75%)',
  'border-radius: 10,': 'border-radius: 8,',
  'borderRadius: 10,': 'borderRadius: 8,',
  'borderRadius: 16': 'borderRadius: 12',
  'borderRadius: 14': 'borderRadius: 12',
  "border: '1px solid #e4e6ea'": "border: '1px solid #8D6E63'",
  "background: 'white'": "background: '#FFFFFF'"
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync('d:/SUTANA/frontend/src/pages/LandingPage/TenderDetailPage.jsx', content, 'utf8');
console.log('Replacements done!');
