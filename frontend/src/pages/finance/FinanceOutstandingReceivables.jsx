import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { triggerNotification } from '../../utils/ceoNotifications';
import { AlertCircle, Download, Search, CheckCircle2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FinanceOutstandingReceivables = () => {
  const navigate = useNavigate();
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [customerFilter, setCustomerFilter] = useState('All');
  const [agingFilter, setAgingFilter] = useState('All');
  
  const loadReceivables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/finance-receivables/book');
      setReceivables(res?.data?.data || []);
    } catch (e) {
      console.error(e);
      triggerNotification('Error', 'Failed to load receivables book.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceivables();
  }, [loadReceivables]);

  const today = new Date();

  // Process data with aging
  const processed = receivables.map(inv => {
    const dueDate = new Date(inv.due_date);
    const diffTime = today - dueDate;
    const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
    
    // For this module, we consider it Outstanding if status isn't "Paid". 
    // However, we want to show all history, so we'll just compute aging.
    return { ...inv, daysOverdue };
  });

  // Extract unique customers
  const uniqueCustomers = [...new Set(processed.map(r => r.customer_name))].sort();

  const filtered = processed.filter(inv => {
    const matchCust = customerFilter === 'All' || inv.customer_name === customerFilter;
    let matchAging = true;
    if (agingFilter === '0-30') matchAging = inv.daysOverdue >= 0 && inv.daysOverdue <= 30;
    if (agingFilter === '31-60') matchAging = inv.daysOverdue > 30 && inv.daysOverdue <= 60;
    if (agingFilter === '61-90') matchAging = inv.daysOverdue > 60 && inv.daysOverdue <= 90;
    if (agingFilter === '>90') matchAging = inv.daysOverdue > 90;
    
    return matchCust && matchAging;
  });

  const fmt = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
  const fmtD = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const totalOutstanding = filtered.reduce((s, r) => s + parseFloat(r.outstanding_balance || 0), 0);
  const totalPaid = filtered.reduce((s, r) => s + parseFloat(r.amount_paid || 0), 0);

  return (
    <div style={{ padding: '0 0 24px 0', background: 'transparent', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a', letterSpacing: '-0.5px' }}>
            <div style={{ background: '#eff6ff', color: '#0284c7', padding: 8, borderRadius: 10 }}>
              <TrendingUp size={24}/>
            </div>
            Receivables Book
          </h1>
          <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: 14 }}>
            Master ledger for all company income, outstanding payments, and settled accounts.
          </p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Download size={16} /> Export Ledger
        </button>
      </div>

      {/* Summary KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Outstanding</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#dc2626' }}>
            <span style={{ fontSize: 20, color: '#94a3b8', marginRight: 6 }}>ETB</span>{fmt(totalOutstanding)}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Paid / Settled</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#16a34a' }}>
            <span style={{ fontSize: 20, color: '#94a3b8', marginRight: 6 }}>ETB</span>{fmt(totalPaid)}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Records</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>
            {filtered.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 20, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Source / Customer</label>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' }}>
              <option value="All">All Sources</option>
              {uniqueCustomers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Aging Filter</label>
            <select value={agingFilter} onChange={e => setAgingFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' }}>
              <option value="All">All Records</option>
              <option value="0-30">0 - 30 Days</option>
              <option value="31-60">31 - 60 Days</option>
              <option value="61-90">61 - 90 Days</option>
              <option value=">90">Over 90 Days</option>
            </select>
          </div>
          <button onClick={() => { setCustomerFilter('All'); setAgingFilter('All'); }} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, height: 42 }}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#64748b', fontSize: 14 }}>Loading receivables ledger...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>Source / Customer</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>Ref / Invoice</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>Dates</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, textAlign: 'right' }}>Total Amount</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, textAlign: 'right' }}>Paid</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, textAlign: 'right' }}>Outstanding</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>No records found matching filters.</td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{inv.customer_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Dept: {inv.department_source || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#0ea5e9', fontFamily: 'monospace', fontWeight: 600 }}>
                    {inv.invoice_no || `REC-ID-${inv.id}`}
                  </td>
                  <td style={{ padding: '16px 24px', color: '#475569', fontSize: 12 }}>
                    <div><span style={{ color: '#94a3b8', width: 30, display: 'inline-block' }}>Inv:</span> {fmtD(inv.invoice_date)}</div>
                    <div style={{ marginTop: 4 }}><span style={{ color: '#94a3b8', width: 30, display: 'inline-block' }}>Due:</span> {fmtD(inv.due_date)}</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {fmt(inv.total_amount)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                    {fmt(inv.amount_paid)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 800, color: parseFloat(inv.outstanding_balance) > 0 ? '#dc2626' : '#94a3b8' }}>
                    {fmt(inv.outstanding_balance)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: inv.status === 'Paid' ? '#f0fdf4' : inv.status === 'Overdue' ? '#fef2f2' : '#fffbeb', color: inv.status === 'Paid' ? '#16a34a' : inv.status === 'Overdue' ? '#dc2626' : '#d97706', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${inv.status === 'Paid' ? '#bbf7d0' : inv.status === 'Overdue' ? '#fecaca' : '#fde68a'}` }}>
                      {inv.status === 'Paid' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                      {inv.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default FinanceOutstandingReceivables;
