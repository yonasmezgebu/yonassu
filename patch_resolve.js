const fs = require('fs');
let content = fs.readFileSync('backend/src/utils/financeIncome.service.js', 'utf8');

const replacement = `  if (method === 'Bank' && (bankName || bankAccNo)) {
    const providerTokens = [
      { key: 'cbe',     names: ['cbe', 'commercial bank', 'commercial'] },
      { key: 'awash',   names: ['awash'] },
      { key: 'dashen',  names: ['dashen'] },
      { key: 'boa',     names: ['buna', 'bank of abyssinia', 'boa'] },
      { key: 'lib',     names: ['liberty', 'lib'] },
      { key: 'hibret',  names: ['hibret', 'hijra'] },
      { key: 'wegagen', names: ['wegagen'] },
      { key: 'aib',     names: ['awash international', 'aib'] },
    ];
    for (const acc of active) {
      const prov = String(acc.bank_provider || '').toLowerCase();
      if (bankAccNo && String(acc.account_number || '').toLowerCase() === bankAccNo) return acc;
      if (bankName) {
        const tokens = providerTokens.find(t => t.key === prov);
        if (tokens && tokens.names.some(n => bankName.includes(n))) return acc;
      }
    }
  }

  if (method === 'Telebirr' && telebirrDetails) {
    const teleNum = String(telebirrDetails.telebirrNumber || telebirrDetails.telebirr_number || '').toLowerCase();
    for (const acc of active) {
      if (teleNum && String(acc.account_number || '').toLowerCase() === teleNum) return acc;
    }
  }`;

content = content.replace(/  if \(method === 'Bank' && \(bankName \|\| bankAccNo\)\) \{[\s\S]*?    \}\n  \}/, replacement);

fs.writeFileSync('backend/src/utils/financeIncome.service.js', content);
console.log('Done');
