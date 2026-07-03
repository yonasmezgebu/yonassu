import React, { useState } from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseApprovalsApproved = () => {
  const [approvals] = useState([
    { id: 'PO-2026-045', type: 'Purchase Order', approvedBy: 'Dr. Tadesse (CEO)', date: '2026-06-25', stampId: 'STP-9812' }
  ]);
  const [filterType, setFilterType] = useState('All');

  const handleExport = () => {
    playSound('success');
    alert('Exporting...');
  };

  const filtered = approvals.filter(a => filterType === 'All' || a.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <CheckCircle color="#16a34a" size={28} /> APPROVED REQUESTS
          </h1>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Type</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option>All</option><option>Purchase Order</option><option>Tender</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Request #', 'Type', 'Approved By', 'Date', 'Stamp ID'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{a.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.type}</td>
                <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: 600 }}>{a.approvedBy}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.date}</td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace' }}>{a.stampId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseApprovalsApproved;
