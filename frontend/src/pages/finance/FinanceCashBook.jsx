import React, { useState, useEffect } from 'react';
import { Book, Download, Printer, Search } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';

const FinanceCashBook = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  useEffect(() => {
    submitNotification('📒 Cash Book Updated', '📒 Cash Book - Click to View');
  }, []);

  // Compute running balance
  // Assume a starting balance of 0 for the beginning of time for the cash book display
  let runningBalance = 0;
  const cashBookWithBalance = financeState.cashBookEntries
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(entry => {
      runningBalance += entry.receipts - entry.payments;
      return { ...entry, balance: runningBalance };
    });

  const filtered = cashBookWithBalance.filter(entry => {
    const matchFrom = !dateFrom || entry.date >= dateFrom;
    const matchTo = !dateTo || entry.date <= dateTo;
    const matchType = typeFilter === 'All' || entry.type === typeFilter;
    return matchFrom && matchTo && matchType;
  });

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0891b2' }}>
            <Book color="#06b6d4" size={28} /> CASH BOOK
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>View complete cash transaction record.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Download size={15} /> Export PDF/Excel
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Transaction Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All</option>
              <option value="CRV">Cash Receipt Voucher (CRV)</option>
              <option value="PV">Payment Voucher (PV)</option>
              <option value="PCV">Petty Cash Voucher (PCV)</option>
            </select>
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, height: 35 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#ecfeff', borderBottom: '1px solid #a5f3fc' }}>
              {['Date', 'Type', 'Reference #', 'Description', 'Receipts (In)', 'Payments (Out)', 'Balance'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col.includes('(') || col === 'Balance' ? 'right' : 'left', color: '#164e63', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No transactions found for the selected filters.</td></tr>
            ) : filtered.map((entry, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{entry.date}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{entry.type}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0891b2' }}>{entry.reference}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{entry.description}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                  {entry.receipts > 0 ? `$${entry.receipts.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                  {entry.payments > 0 ? `$${entry.payments.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                  ${entry.balance.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceCashBook;
