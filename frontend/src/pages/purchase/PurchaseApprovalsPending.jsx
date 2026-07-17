import React, { useState, useEffect } from 'react';
import { Clock, Send } from 'lucide-react';
import { playSound } from '../../utils/purchaseSound';

const PurchaseApprovalsPending = () => {
  const [approvals, setApprovals] = useState([
    { id: 'REQ-2026-001', type: 'Purchase Order', amount: 45000, requestedBy: 'Abebe Kebede', daysPending: 3 },
    { id: 'TND-2026-042', type: 'Tender', amount: 120000, requestedBy: 'Procurement Comm.', daysPending: 5 }
  ]);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    playSound('info');
  }, []);

  const handleReminder = (id) => {
    playSound('success');
    alert(`Reminder sent to CEO for ${id}`);
  };

  const filtered = approvals.filter(a => filterType === 'All' || a.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <Clock color="#d97706" size={28} /> PENDING APPROVALS
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>All requests awaiting CEO approval.</p>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Type</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option>All</option><option>Purchase Order</option><option>Tender</option><option>Fund</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Request #', 'Type', 'Amount', 'Requested By', 'Days Pending', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Amount' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{a.id}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.type}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold' }}>ETB {a.amount.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{a.requestedBy}</td>
                <td style={{ padding: '12px 14px', color: '#d97706', fontWeight: 600 }}>{a.daysPending} days</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleReminder(a.id)} style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Send size={14} /> Send Reminder to CEO</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseApprovalsPending;
