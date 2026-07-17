import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Download, CheckCircle2, TrendingDown, RefreshCw } from 'lucide-react';
import api from '../../services/apiClient';

const FinanceOutstandingPayables = () => {
  const [payables, setPayables]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [agingFilter, setAgingFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance-payables');
      setPayables(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date();

  const processed = payables.map(p => {
    const dueDate = new Date(p.due_date || p.date);
    const diff = today - dueDate;
    const daysOverdue = diff > 0 ? Math.floor(diff / 86400000) : 0;
    return { ...p, daysOverdue };
  });

  const uniqueSuppliers = [...new Set(processed.map(p => p.paid_to))].sort();
  const uniqueCategories = [...new Set(processed.map(p => p.category))].sort();

  const filtered = processed.filter(p => {
    const matchS = supplierFilter === 'All' || p.paid_to === supplierFilter;
    const matchC = categoryFilter === 'All' || p.category === categoryFilter;
    let matchA = true;
    if (agingFilter === '0-30') matchA = p.daysOverdue >= 0 && p.daysOverdue <= 30;
    if (agingFilter === '31-60') matchA = p.daysOverdue > 30 && p.daysOverdue <= 60;
    if (agingFilter === '61-90') matchA = p.daysOverdue > 60 && p.daysOverdue <= 90;
    if (agingFilter === '>90') matchA = p.daysOverdue > 90;
    return matchS && matchC && matchA;
  });

  const fmt  = n => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const fmtD = d => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const totalPaid       = filtered.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
  const totalOutstanding = filtered.reduce((s, p) => s + parseFloat(p.outstanding_balance || 0), 0);

  return (
    <div style={{ padding: '0 0 24px 0', background: 'transparent', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a', letterSpacing: '-0.5px' }}>
            <div style={{ background: '#fff7ed', color: '#ea580c', padding: 8, borderRadius: 10 }}>
              <TrendingDown size={24} />
            </div>
            Payables Book
          </h1>
          <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: 14 }}>
            Master ledger of all approved payments disbursed by Finance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Disbursed (Filtered)</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0284c7' }}>
            <span style={{ fontSize: 18, color: '#94a3b8', marginRight: 6 }}>ETB</span>{fmt(totalPaid)}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Outstanding Balance</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: totalOutstanding > 0 ? '#dc2626' : '#94a3b8' }}>
            <span style={{ fontSize: 18, color: '#94a3b8', marginRight: 6 }}>ETB</span>{fmt(totalOutstanding)}
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Records</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{filtered.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Paid To</label>
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' }}>
              <option value="All">All Payees</option>
              {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' }}>
              <option value="All">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Aging</label>
            <select value={agingFilter} onChange={e => setAgingFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, outline: 'none' }}>
              <option value="All">All Records</option>
              <option value="0-30">0 - 30 Days</option>
              <option value="31-60">31 - 60 Days</option>
              <option value="61-90">61 - 90 Days</option>
              <option value=">90">Over 90 Days</option>
            </select>
          </div>
          <button onClick={() => { setSupplierFilter('All'); setCategoryFilter('All'); setAgingFilter('All'); }} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, height: 42 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,.05)' }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#64748b', fontSize: 14 }}>Loading payables ledger...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                {['PV Number', 'Date', 'Paid To', 'Category', 'Method', 'Description', 'Total', 'Paid', 'Outstanding', 'Status'].map(col => (
                  <th key={col} style={{ padding: '16px 18px', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, textAlign: ['Total', 'Paid', 'Outstanding'].includes(col) ? 'right' : 'left' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                  No records match the current filters.
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>{p.pv_number}</td>
                  <td style={{ padding: '14px 18px', color: '#475569', fontSize: 12 }}>{fmtD(p.date)}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>{p.paid_to}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>{p.payment_method}</td>
                  <td style={{ padding: '14px 18px', color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{fmt(p.total_amount)}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{fmt(p.amount_paid)}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: parseFloat(p.outstanding_balance) > 0 ? '#dc2626' : '#94a3b8' }}>{fmt(p.outstanding_balance)}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: p.status === 'Paid' ? '#f0fdf4' : p.status === 'Overdue' ? '#fef2f2' : '#fffbeb', color: p.status === 'Paid' ? '#16a34a' : p.status === 'Overdue' ? '#dc2626' : '#d97706', padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: `1px solid ${p.status === 'Paid' ? '#bbf7d0' : p.status === 'Overdue' ? '#fecaca' : '#fde68a'}` }}>
                      {p.status === 'Paid' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                      {p.status}
                    </span>
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

export default FinanceOutstandingPayables;
