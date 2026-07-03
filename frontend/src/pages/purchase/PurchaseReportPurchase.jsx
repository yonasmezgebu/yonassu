import React from 'react';
import { FileText, Download } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseReportPurchase = () => {
  const handleExport = () => {
    playSound('success');
    alert('Exporting Purchase Report...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <FileText color="#0284c7" size={28} /> PURCHASE REPORT
        </h1>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total POs', value: '1,245' },
          { label: 'Total Spend', value: '$2,450,000' },
          { label: 'Top Supplier', value: 'Global Pharma' },
          { label: 'Top Category', value: 'Pharmaceuticals' }
        ].map(k => (
          <div key={k.label} style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748b' }}>
        Detailed Purchase Data Table would render here. (Mocked for layout)
      </div>
    </div>
  );
};

export default PurchaseReportPurchase;
