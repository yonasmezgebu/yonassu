import React, { useState, useEffect } from 'react';
import { FileText, Filter, Download, CheckCircle, XCircle } from 'lucide-react';
import { notifyNewRequisition } from '../../utils/storeNotifications';

const mockRequisitions = [
  { id: 'M20-001', dept: 'Pharmacy', items: 'Amoxicillin 500mg', qty: 200, priority: 'Urgent', date: '2026-06-30', status: 'Pending' },
  { id: 'M20-002', dept: 'Sales', items: 'A4 Paper Reams', qty: 10, priority: 'Normal', date: '2026-06-30', status: 'Approved' },
  { id: 'M20-003', dept: 'Pharmacy', items: 'IV Fluid (500ml)', qty: 30, priority: 'Emergency', date: '2026-07-01', status: 'Pending' },
  { id: 'M20-004', dept: 'Other', items: 'Hand Sanitizer 500ml', qty: 20, priority: 'Normal', date: '2026-07-01', status: 'Issued' },
  { id: 'M20-005', dept: 'Pharmacy', items: 'Surgical Gloves (L)', qty: 50, priority: 'Urgent', date: '2026-07-01', status: 'Rejected' },
];

const priorityColors = { Normal: { bg: '#f1f5f9', c: '#475569' }, Urgent: { bg: '#fef3c7', c: '#92400e' }, Emergency: { bg: '#fee2e2', c: '#991b1b' } };
const statusColors = { Pending: { bg: '#fef3c7', c: '#92400e' }, Approved: { bg: '#dcfce7', c: '#166534' }, Issued: { bg: '#eff6ff', c: '#1d4ed8' }, Rejected: { bg: '#fee2e2', c: '#991b1b' } };

const StoreRequisitions = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [reqs, setReqs] = useState(mockRequisitions);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const pending = mockRequisitions.filter(r => r.status === 'Pending');
    if (pending.length) notifyNewRequisition(pending[0].dept, pending[0].items, pending[0].qty);
  }, []);

  const handleProcess = (id) => {
    setReqs(r => r.map(x => x.id === id ? { ...x, status: 'Issued' } : x));
  };

  const handleReject = (id) => {
    if (!rejectReason.trim()) return;
    setReqs(r => r.map(x => x.id === id ? { ...x, status: 'Rejected', rejectReason } : x));
    setRejectModal(null);
    setRejectReason('');
  };

  const filtered = reqs
    .filter(r => filterDept === 'All' || r.dept === filterDept)
    .filter(r => filterStatus === 'All' || r.status === filterStatus);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText color="#6366f1" size={28} /> REQUISITIONS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Document Model: M20 — View & Process All Requisitions</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
          <Download size={15} /> Export
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
        <Filter size={15} color="#64748b" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Departments</option>
          <option>Pharmacy</option>
          <option>Sales</option>
          <option>Other</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}>
          <option value="All">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Issued</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Requisition #', 'Requesting Dept', 'Items Requested', 'Qty', 'Priority', 'Request Date', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6366f1', fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.dept}</td>
                <td style={{ padding: '12px 14px' }}>{r.items}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{r.qty}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: priorityColors[r.priority].bg, color: priorityColors[r.priority].c }}>{r.priority}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.date}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusColors[r.status].bg, color: statusColors[r.status].c }}>{r.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleProcess(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                        <CheckCircle size={13} /> Process
                      </button>
                      <button onClick={() => setRejectModal(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                  {r.status !== 'Pending' && <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REJECT MODAL */}
      {rejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 420, border: '2px solid #ef4444' }}>
            <h3 style={{ margin: '0 0 12px', color: '#991b1b' }}>Reject Requisition</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Please provide a reason for rejecting this requisition:</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Enter rejection reason..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
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

export default StoreRequisitions;
