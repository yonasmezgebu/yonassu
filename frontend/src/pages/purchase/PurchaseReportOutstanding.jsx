import React, { useState } from 'react';
import { AlertCircle, Download, Send } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseReportOutstanding = () => {
  const [orders] = useState([
    { id: 'PO-2026-031', supplier: 'MedTech Solutions', items: 'Surgical Gloves', expectedDate: '2026-06-15', daysOverdue: 10, priority: 'High' }
  ]);

  const handleExport = () => {
    playSound('success');
    alert('Exporting...');
  };

  const handleFollowUp = (id) => {
    playSound('success');
    alert(`Follow up sent for ${id}`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <AlertCircle color="#dc2626" size={28} /> OUTSTANDING ORDERS
        </h1>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['PO #', 'Supplier', 'Items', 'Expected Date', 'Days Overdue', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{o.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{o.supplier}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{o.items}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{o.expectedDate}</td>
                <td style={{ padding: '12px 14px', color: '#dc2626', fontWeight: 600 }}>{o.daysOverdue} days</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleFollowUp(o.id)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Send size={14} /> Follow Up</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseReportOutstanding;
