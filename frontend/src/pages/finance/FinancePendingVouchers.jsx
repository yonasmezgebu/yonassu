import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { financeState, approveVoucher, rejectVoucher } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const typeBadge = { CRV: '#22c55e', PV: '#f59e0b', PCV: '#8b5cf6' };

const FinancePendingVouchers = () => {
  const [pending, setPending] = useState([...financeState.pendingVouchers]);
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('Oldest First');
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const refresh = () => setPending([...financeState.pendingVouchers]);

  const handleApprove = (id) => {
    try {
      approveVoucher(id);
      submitNotification('✅ Voucher Approved', '✅ Approved Vouchers - Click to View', 'success.mp3');
      refresh();
    } catch (err) { alert(err.message); }
  };

  const handleReject = (id) => {
    if (!rejectReason.trim()) { alert('Rejection reason is required.'); return; }
    try {
      rejectVoucher(id, rejectReason);
      submitNotification('❌ Voucher Rejected', '❌ Rejected Vouchers - Click to Review', 'info.mp3');
      setRejectModalId(null);
      setRejectReason('');
      refresh();
    } catch (err) { alert(err.message); }
  };

  let filtered = pending.filter(v => filterType === 'All' || v.type === filterType);
  if (sortBy === 'Oldest First') filtered = [...filtered].sort((a, b) => b.daysPending - a.daysPending);
  if (sortBy === 'Amount') filtered = [...filtered].sort((a, b) => b.amount - a.amount);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#d97706' }}>
            <Clock color="#f59e0b" size={28} /> PENDING VOUCHERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Vouchers awaiting Finance Manager approval.</p>
        </div>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#d97706' }}>{pending.length}</div>
          <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'CRV', 'PV', 'PCV'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
              background: filterType === t ? (typeBadge[t] || '#475569') : 'transparent',
              borderColor: filterType === t ? (typeBadge[t] || '#475569') : '#cbd5e1',
              color: filterType === t ? 'white' : '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 13
            }}>{t}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
          <option>Oldest First</option>
          <option>Amount</option>
        </select>
      </div>

      {/* Rejection Modal */}
      {rejectModalId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', color: '#dc2626', fontSize: 16 }}>Reject Voucher — {rejectModalId}</h3>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reason for Rejection *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Provide a clear reason for rejection…" style={{ width: '100%', padding: 10, border: '1px solid #fecaca', borderRadius: 6, boxSizing: 'border-box', fontSize: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setRejectModalId(null); setRejectReason(''); }} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', background: 'white' }}>Cancel</button>
              <button onClick={() => handleReject(rejectModalId)} style={{ padding: '8px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Voucher #', 'Type', 'Date', 'Payee / From', 'Amount', 'Department', 'Created By', 'Days Pending', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Amount' || col === 'Actions' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No pending vouchers. All caught up! 🎉</td></tr>
            )}
            {filtered.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>{v.id}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: `${typeBadge[v.type]}22`, color: typeBadge[v.type] }}>{v.type}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{v.date}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{v.payeeFrom}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>ETB {v.amount.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{v.department}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{v.createdBy}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: v.daysPending > 2 ? '#fee2e2' : '#fef3c7', color: v.daysPending > 2 ? '#dc2626' : '#d97706' }}>
                    {v.daysPending} day{v.daysPending !== 1 ? 's' : ''}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => handleApprove(v.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#166534', fontWeight: 600 }}>
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => setRejectModalId(v.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancePendingVouchers;
