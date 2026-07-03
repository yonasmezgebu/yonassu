import React, { useState } from 'react';
import { XCircle, RefreshCw, Download } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseApprovalsRejected = () => {
  const [approvals, setApprovals] = useState([
    { id: 'REQ-2026-012', type: 'Purchase Order', rejectedBy: 'Dr. Tadesse (CEO)', reason: 'Budget exceeded for Q2', date: '2026-06-20' }
  ]);

  const handleResubmit = (id) => {
    playSound('success');
    setApprovals(prev => prev.filter(a => a.id !== id));
    alert(`Draft created for ${id} to resubmit with corrections.`);
  };

  const handleExport = () => {
    playSound('success');
    alert('Exporting...');
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <XCircle color="#dc2626" size={28} /> REJECTED REQUESTS
          </h1>
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          <Download size={16} /> Export / Print
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Request #', 'Type', 'Rejected By', 'Reason', 'Date', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {approvals.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{a.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.type}</td>
                <td style={{ padding: '12px 14px', color: '#dc2626', fontWeight: 600 }}>{a.rejectedBy}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.reason}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.date}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleResubmit(a.id)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={14} /> Resubmit with Corrections</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseApprovalsRejected;
