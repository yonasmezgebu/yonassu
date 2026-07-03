import React, { useState, useEffect } from 'react';
import { Clock, Filter, CheckCircle, XCircle } from 'lucide-react';
import { notifyPendingRequests } from '../../utils/storeNotifications';

const mockPending = [
  { id: 'M20-003', dept: 'Pharmacy', items: 'IV Fluid (500ml)', qty: 30, daysPending: 1, priority: 'Emergency' },
  { id: 'M20-001', dept: 'Pharmacy', items: 'Amoxicillin 500mg', qty: 200, daysPending: 2, priority: 'Urgent' },
  { id: 'M20-006', dept: 'Other', items: 'Office Chairs', qty: 5, daysPending: 4, priority: 'Normal' },
  { id: 'M20-007', dept: 'Sales', items: 'Printer Paper', qty: 20, daysPending: 3, priority: 'Normal' },
];

const priorityOrder = { Emergency: 0, Urgent: 1, Normal: 2 };
const priorityColors = { Normal: { bg: '#f1f5f9', c: '#475569' }, Urgent: { bg: '#fef3c7', c: '#92400e' }, Emergency: { bg: '#fee2e2', c: '#991b1b' } };

const StorePendingRequests = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [requests, setRequests] = useState(mockPending);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    notifyPendingRequests(mockPending.length);
  }, []);

  const handleApprove = (id) => {
    setApproved(a => [...a, id]);
    setRequests(r => r.filter(x => x.id !== id));
  };

  const handleReject = (id) => {
    if (!rejectReason.trim()) return;
    setRequests(r => r.filter(x => x.id !== id));
    setRejectModal(null);
    setRejectReason('');
  };

  const sorted = [...requests]
    .filter(r => filterDept === 'All' || r.dept === filterDept)
    .filter(r => filterPriority === 'All' || r.priority === filterPriority)
    .sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return b.daysPending - a.daysPending; // oldest first within priority
    });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock color="#f59e0b" size={28} /> PENDING REQUESTS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M20 — Manager Action Required</p>
        </div>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, color: '#92400e' }}>
          ⏳ {sorted.length} Pending
        </div>
      </div>

      {/* Sort note */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#64748b' }}>
        📋 Default sort: <strong>Priority weighted</strong> (Emergency → Urgent → Normal), then <strong>Oldest First</strong> within each priority.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option>
          <option>Sales</option>
          <option>Other</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Priorities</option>
          <option>Emergency</option>
          <option>Urgent</option>
          <option>Normal</option>
        </select>
      </div>

      {approved.length > 0 && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#166534' }}>
          ✅ {approved.length} request(s) approved this session. Item issuance has been triggered.
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Request #', 'Requesting Dept', 'Items Requested', 'Qty', 'Days Pending', 'Priority', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan="7" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No pending requests found.</td></tr>
            )}
            {sorted.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: r.priority === 'Emergency' ? '#fff5f5' : r.priority === 'Urgent' ? '#fffbf0' : 'white' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.dept}</td>
                <td style={{ padding: '12px 14px' }}>{r.items}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.qty}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontWeight: 700, color: r.daysPending >= 3 ? '#b91c1c' : '#475569' }}>{r.daysPending}d</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: priorityColors[r.priority].bg, color: priorityColors[r.priority].c }}>{r.priority}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApprove(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => setRejectModal(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 420, border: '2px solid #ef4444' }}>
            <h3 style={{ margin: '0 0 12px', color: '#991b1b' }}>Reject Request</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Reason for rejection (required)..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} style={{ padding: '8px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleReject(rejectModal)} style={{ padding: '8px 20px', background: '#991b1b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePendingRequests;
