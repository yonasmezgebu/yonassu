import React from 'react';
import { Users, Download } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseReportSupplier = () => {
  const handleExport = () => {
    playSound('success');
    alert('Exporting Supplier Report...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Users color="#8b5cf6" size={28} /> SUPPLIER REPORT
        </h1>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748b' }}>
        Complete supplier performance summary table would render here.
      </div>
    </div>
  );
};

export default PurchaseReportSupplier;
