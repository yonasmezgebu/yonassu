import React, { useState } from 'react';
import { XCircle, Download, RotateCcw, CheckCircle } from 'lucide-react';
import { financeState, resubmitVoucher } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const typeBadge = { CRV: '#22c55e', PV: '#f59e0b', PCV: '#8b5cf6' };

const FinanceRejectedVouchers = () => {
  const [rejected, setRejected] = useState([...financeState.rejectedVouchers]);
  const [filterType, setFilterType] = useState('All');
  const [resubmitted, setResubmitted] = useState({});

  React.useEffect(() => {
    setRejected([...financeState.rejectedVouchers]);
    submitNotification(
      `❌ ${financeState.rejectedVouchers.length} Vouchers Rejected`,
      '❌ Rejected Vouchers - Click to Review',
      'info.mp3'
    );
  }, []);

  const handleResubmit = (id) => {
    try {
      const newVoucher = resubmitVoucher(id);
      setResubmitted(prev => ({ ...prev, [id]: newVoucher.id }));
      submitNotification(`⏳ Voucher Resubmitted as ${newVoucher.id}`, '⏳ Vouchers Awaiting Approval - Click to Review', 'info.mp3');
    } catch (err) { alert(err.message); }
  };

  const filtered = rejected.filter(v => filterType === 'All' || v.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626' }}>
            <XCircle color="#ef4444" size={28} /> REJECTED VOUCHERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>View rejected vouchers and resubmit with corrections.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#dc2626' }}>{rejected.length}</div>
            <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>Rejected</div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Audit Trail Notice */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
        ⚠ <strong>Audit Trail Protected:</strong> Rejected vouchers cannot be edited. Use <strong>[Resubmit]</strong> to create a new voucher pre-filled with the rejected data — this generates a new voucher number and preserves the original record.
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 8 }}>
        {['All', 'CRV', 'PV', 'PCV'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid',
            background: filterType === t ? (typeBadge[t] || '#dc2626') : 'transparent',
            borderColor: filterType === t ? (typeBadge[t] || '#dc2626') : '#cbd5e1',
            color: filterType === t ? 'white' : '#475569',
            cursor: 'pointer', fontWeight: 600, fontSize: 13
          }}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Voucher #', 'Type', 'Date', 'Payee / From', 'Amount', 'Rejected By', 'Rejection Date', 'Reason', 'Action'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Amount' || col === 'Action' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No rejected vouchers found.</td></tr>
            )}
            {filtered.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: '#dc2626' }}>{v.id}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: `${typeBadge[v.type]}22`, color: typeBadge[v.type] }}>{v.type}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{v.date}</td>
                <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>{v.payeeFrom}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>ETB {v.amount.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#475569' }}>{v.rejectedBy}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{v.rejectionDate}</td>
                <td style={{ padding: '12px 14px', color: '#dc2626', fontSize: 13, maxWidth: 200 }}>
                  <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{v.rejectionReason}</div>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {resubmitted[v.id] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                      <CheckCircle size={13} /> Resubmitted as {resubmitted[v.id]}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleResubmit(v.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 5, cursor: 'pointer', fontSize: 12, color: '#c2410c', fontWeight: 600 }}
                    >
                      <RotateCcw size={13} /> Resubmit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceRejectedVouchers;
