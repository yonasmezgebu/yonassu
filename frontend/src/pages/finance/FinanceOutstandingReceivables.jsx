import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, Mail, CheckCircle } from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import { submitNotification } from '../../utils/pharmacyNotifications';
import { useNavigate } from 'react-router-dom';

const FinanceOutstandingReceivables = () => {
  const navigate = useNavigate();
  const [customerFilter, setCustomerFilter] = useState('All');
  const [agingFilter, setAgingFilter] = useState('All');

  useEffect(() => {
    submitNotification('📊 Outstanding Receivables Report', '📊 A/R Report - Click to View', 'info.mp3');
  }, []);

  const today = new Date();

  const unpaidInvoices = financeState.customerInvoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue').map(inv => {
    const dueDate = new Date(inv.dueDate);
    const diffTime = today - dueDate;
    const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
    return { ...inv, daysOverdue, outstandingBalance: inv.totalAmount - inv.amountPaid };
  });

  const filtered = unpaidInvoices.filter(inv => {
    const matchCust = customerFilter === 'All' || inv.customerName === customerFilter;
    let matchAging = true;
    if (agingFilter === '0-30') matchAging = inv.daysOverdue >= 0 && inv.daysOverdue <= 30;
    if (agingFilter === '31-60') matchAging = inv.daysOverdue > 30 && inv.daysOverdue <= 60;
    if (agingFilter === '61-90') matchAging = inv.daysOverdue > 60 && inv.daysOverdue <= 90;
    if (agingFilter === '>90') matchAging = inv.daysOverdue > 90;
    
    return matchCust && matchAging;
  });

  const handleSendReminder = (customer) => {
    alert(`Reminder email sent to ${customer}`);
  };

  const handleMarkAsPaid = (inv) => {
    navigate(`/finance/customer-payments?invoiceRef=${inv.id}&customer=${encodeURIComponent(inv.customerName)}`);
  };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <AlertCircle color="#0369a1" size={28} /> OUTSTANDING RECEIVABLES
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Accounts Receivable (A/R) Aging Report.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
          <Download size={16} /> Export A/R Report
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Customer</label>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
              <option value="All">All Customers</option>
              {financeState.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
          <button onClick={() => { setCustomerFilter('All'); setAgingFilter('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, height: 35 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Customer Name', 'Invoice #', 'Invoice Date', 'Due Date', 'Total Amount', 'Amount Paid', 'Outstanding', 'Aging', 'Actions'].map(col => (
                <th key={col} style={{ padding: '12px 16px', textAlign: col === 'Actions' || col.includes('Amount') || col === 'Outstanding' ? 'right' : 'left', color: '#475569', fontWeight: 600, fontSize: 13 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No outstanding receivables found.</td></tr>
            ) : filtered.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{inv.customerName}</td>
                <td style={{ padding: '12px 16px', color: '#0284c7', fontFamily: 'monospace' }}>{inv.id}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{inv.date}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{inv.dueDate}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>${inv.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>${inv.amountPaid.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>${inv.outstandingBalance.toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: inv.daysOverdue > 60 ? '#fee2e2' : inv.daysOverdue > 0 ? '#ffedd5' : '#f1f5f9',
                    color: inv.daysOverdue > 60 ? '#dc2626' : inv.daysOverdue > 0 ? '#ea580c' : '#64748b'
                  }}>
                    {inv.daysOverdue > 0 ? `${inv.daysOverdue} Days` : 'Not Due'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => handleSendReminder(inv.customerName)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#475569' }} title="Send Reminder">
                    <Mail size={14} /> Reminder
                  </button>
                  <button onClick={() => handleMarkAsPaid(inv)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#059669', fontWeight: 600 }} title="Mark as Paid (Route to Payments)">
                    <CheckCircle size={14} /> Pay
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

export default FinanceOutstandingReceivables;
