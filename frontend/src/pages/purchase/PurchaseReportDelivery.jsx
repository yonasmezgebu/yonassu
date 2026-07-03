import React from 'react';
import { Truck, Download } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseReportDelivery = () => {
  const handleExport = () => {
    playSound('success');
    alert('Exporting Delivery Report...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Truck color="#d97706" size={28} /> DELIVERY REPORT
        </h1>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#64748b' }}>
        Complete delivery tracking summary would render here.
      </div>
    </div>
  );
};

export default PurchaseReportDelivery;
