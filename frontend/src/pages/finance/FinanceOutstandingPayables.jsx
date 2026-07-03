import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, CalendarClock, CreditCard } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useNavigate } from 'react-router-dom';

const FinanceOutstandingPayables = () => {
  const navigate = useNavigate();
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [agingFilter, setAgingFilter] = useState('All');

  useEffect(() => {
    submitNotification('📊 Outstanding Payables Report', '📊 A/P Report - Click to View', 'info.mp3');
  }, []);

  const today = new Date();

  const unpaidBills = financeState.supplierBills.filter(bill => bill.status === 'Unpaid' || bill.status === 'Overdue').map(bill => {
    const dueDate = new Date(bill.dueDate);
    const diffTime = today - dueDate;
    const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
    return { ...bill, daysOverdue, outstandingBalance: bill.totalAmount - bill.amountPaid };
  });

  const filtered = unpaidBills.filter(bill => {
    const matchSupp = supplierFilter === 'All' || bill.supplierName === supplierFilter;
    let matchAging = true;
    if (agingFilter === '0-30') matchAging = bill.daysOverdue >= 0 && bill.daysOverdue <= 30;
    if (agingFilter === '31-60') matchAging = bill.daysOverdue > 30 && bill.daysOverdue <= 60;
    if (agingFilter === '61-90') matchAging = bill.daysOverdue > 60 && bill.daysOverdue <= 90;
    if (agingFilter === '>90') matchAging = bill.daysOverdue > 90;
    
    return matchSupp && matchAging;
  });

  const handleSchedulePayment = (bill) => {
    navigate(`/finance/supplier-payments?billRef=${bill.id}&supplier=${encodeURIComponent(bill.supplierName)}`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#c2410c' }}>
            <AlertCircle color="#c2410c" size={28} /> OUTSTANDING PAYABLES
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Accounts Payable (A/P) Aging Report.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
          <Download size={16} /> Export A/P Report
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Supplier</label>
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All Suppliers</option>
              {financeState.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Days Overdue (Aging)</label>
            <select value={agingFilter} onChange={e => setAgingFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All Unpaid</option>
              <option value="0-30">0 - 30 Days</option>
              <option value="31-60">31 - 60 Days</option>
              <option value="61-90">61 - 90 Days</option>
              <option value=">90">Over 90 Days</option>
            </select>
          </div>
          <button onClick={() => { setSupplierFilter('All'); setAgingFilter('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, height: 35 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Supplier Name', 'Bill #', 'Bill Date', 'Due Date', 'Total Amount', 'Amount Paid', 'Outstanding', 'Aging', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Actions' || col.includes('Amount') || col === 'Outstanding' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No outstanding payables found.</td></tr>
            ) : filtered.map(bill => (
              <tr key={bill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{bill.supplierName}</td>
                <td style={{ padding: '12px 16px', color: '#ea580c', fontFamily: 'monospace' }}>{bill.id}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{bill.dateReceived}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{bill.dueDate}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>${bill.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>${bill.amountPaid.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>${bill.outstandingBalance.toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: bill.daysOverdue > 60 ? '#fee2e2' : bill.daysOverdue > 0 ? '#ffedd5' : '#f1f5f9',
                    color: bill.daysOverdue > 60 ? '#dc2626' : bill.daysOverdue > 0 ? '#ea580c' : '#64748b'
                  }}>
                    {bill.daysOverdue > 0 ? `${bill.daysOverdue} Days` : 'Not Due'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => handleSchedulePayment(bill)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#d97706', fontWeight: 600 }} title="Schedule Payment (Route to PV)">
                    <CreditCard size={14} /> Pay Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceOutstandingPayables;
