import React, { useState } from 'react';
import { CheckCircle, Download, Printer } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const typeBadge = { CRV: '#22c55e', PV: '#f59e0b', PCV: '#8b5cf6' };

const FinanceApprovedVouchers = () => {
  const [approved, setApproved] = useState([...financeState.approvedVouchers]);
  const [filterType, setFilterType] = useState('All');

  // Refresh from shared state on mount to pick up any newly approved items
  React.useEffect(() => {
    setApproved([...financeState.approvedVouchers]);
    submitNotification(
      `✅ ${financeState.approvedVouchers.length} Vouchers Approved Today`,
      '✅ Approved Vouchers - Click to View',
      'success.mp3'
    );
  }, []);

  const filtered = approved.filter(v => filterType === 'All' || v.type === filterType);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a' }}>
            <CheckCircle color="#22c55e" size={28} /> APPROVED VOUCHERS
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>All vouchers that have been approved by the Finance Manager.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>{approved.length}</div>
            <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Approved</div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Download size={16} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16, display: 'flex', gap: 8 }}>
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

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Voucher #', 'Type', 'Date', 'Payee / From', 'Amount', 'Department', 'Approved By', 'Approval Date', 'Digital Stamp ID'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: col === 'Amount' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No approved vouchers found.</td></tr>
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
                <td style={{ padding: '12px 14px', color: '#475569' }}>{v.approvedBy}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{v.approvalDate}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>
                    🔏 {v.stampId}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceApprovedVouchers;
