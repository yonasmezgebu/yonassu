import React, { useState, useEffect } from 'react';
import {
  DollarSign, Download, CheckCircle, XCircle, FileText,
  ArrowDownRight, ArrowUpRight, Banknote, Eye, ChevronDown,
  ChevronUp, RefreshCw, Users, Clock, TrendingUp, TrendingDown,
  AlertTriangle, CreditCard, Landmark, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import api from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─────────────────────────────── helpers ─────────────────────────────── */
const fmt = val =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val || 0);

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316'];

/* ─────────────────────────── shared sub-components ──────────────────── */
const SigPreview = ({ label, name, sig }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{ height: 70, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      {sig ? <img src={sig} alt={label} style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ color: '#cbd5e1', fontSize: 11 }}>No signature</span>}
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{name || '—'}</div>
    <div style={{ fontSize: 10, color: '#94a3b8' }}>{label}</div>
  </div>
);

const PCVDetailPanel = ({ pcv }) => {
  const pm = pcv.payment_method;
  return (
    <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Date',            value: new Date(pcv.date).toLocaleDateString('en-GB') },
          { label: 'Amount',          value: `ETB ${parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Payment Method',  value: pm },
          { label: 'Reference #',     value: pcv.reference_no || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fefce8', border: '1px dashed #fde047', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a16207', marginBottom: 4 }}>PAID TO</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#713f12', marginBottom: 6 }}>{pcv.paid_to}</div>
        <div style={{ fontSize: 13, color: '#78350f' }}>{pcv.description}</div>
      </div>
      {pm === 'Bank' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            <div>Bank: <b>{pcv.bank_name}</b></div>
            <div>A/C Name: <b>{pcv.account_holder}</b></div>
            <div>A/C No: <b>{pcv.account_number}</b></div>
            {pcv.cheque_no && <div>Cheque #: <b>{pcv.cheque_no}</b></div>}
          </div>
        </div>
      )}
      {pm === 'Telebirr' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 8 }}>Telebirr Details</div>
          <div style={{ fontSize: 13 }}>
            <div>Mobile: <b>{pcv.telebirr_number}</b></div>
            <div>Name: <b>{pcv.telebirr_name}</b></div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16 }}>
        <SigPreview label="Prepared By"      name={pcv.prepared_by}  sig={pcv.prepared_signature} />
        <SigPreview label="Checked By"       name={pcv.checked_by}   sig={pcv.checked_signature} />
        <SigPreview label="Payee's Signature" name={pcv.receiver_name} sig={pcv.receiver_signature} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════ KPI Card ═══════════════════════════ */
const KPICard = ({ label, value, sub, icon: Icon, gradient, iconColor }) => (
  <div style={{
    background: gradient,
    borderRadius: 16, padding: '22px 24px',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
    color: 'white'
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{sub}</div>}
    <Icon size={90} style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.15 }} />
  </div>
);

/* ═══════════════════════════ MAIN COMPONENT ══════════════════════════ */
const CEOFinance = () => {
  const [activeTab,   setActiveTab]   = useState('Overview');
  const [finData,     setFinData]     = useState(null);
  const [finLoading,  setFinLoading]  = useState(true);

  // PCV
  const [pcvs,         setPcvs]         = useState([]);
  const [loadingPcvs,  setLoadingPcvs]  = useState(true);
  const [expandedPcv,  setExpandedPcv]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading,setActionLoading]= useState(null);
  const [toast,        setToast]        = useState(null);

  // Payroll
  const [payrollQueue,         setPayrollQueue]         = useState([]);
  const [payrollLoading,       setPayrollLoading]       = useState(false);
  const [payrollDetail,        setPayrollDetail]        = useState({});
  const [payrollExpanded,      setPayrollExpanded]      = useState(null);
  const [payrollDetailLoading, setPayrollDetailLoading] = useState(null);

  // Fund requests
  const [funds,       setFunds]       = useState([]);
  const [fundsLoading,setFundsLoading]= useState(false);

  /* ── fetch overview ── */
  useEffect(() => {
    api.get('/ceo/finance-overview')
      .then(res => setFinData(res.data))
      .catch(() => setFinData(null))
      .finally(() => setFinLoading(false));
    loadPcvs();
  }, []);

  /* ── fetch pending fund requests from finance income submissions ── */
  const fetchFunds = async () => {
    setFundsLoading(true);
    try {
      const res = await api.get('/finance/income-submissions?status=pending');
      const rows = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
      setFunds(rows);
    } catch { setFunds([]); }
    finally { setFundsLoading(false); }
  };

  /* ── payroll ── */
  const fetchPayrollQueue = async () => {
    setPayrollLoading(true);
    try {
      let rows = [];
      try {
        const res = await api.get('/hr/etp/payroll/finance-queue');
        rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch {
        const res2 = await api.get('/hr/etp/payroll/approved-list');
        const all = Array.isArray(res2?.data) ? res2.data : (Array.isArray(res2) ? res2 : []);
        rows = all.filter(p => p.approval_status === 'Approved' || p.approval_status === 'Paid')
          .map(p => ({
            month_number: p.month_number, year_number: p.year_number,
            total_net_pay: p.company_net_pay, total_employees: p.total_employees,
            approved_by_ceo: p.approved_by,
            payment_status: p.approval_status === 'Paid' ? 'Paid' : 'Pending Payment',
          }));
      }
      setPayrollQueue(rows);
      rows.forEach(row => {
        const key = `${row.month_number}-${row.year_number}`;
        api.get(`/hr/etp/payroll/summary/${row.month_number}/${row.year_number}`)
          .then(res => {
            const d = res?.data || res;
            setPayrollDetail(prev => ({ ...prev, [key]: d.employees || [] }));
          }).catch(() => {});
      });
    } catch (e) { console.error(e); }
    finally { setPayrollLoading(false); }
  };

  const loadPayrollDetail = async (row) => {
    const key = `${row.month_number}-${row.year_number}`;
    if (payrollExpanded === key) { setPayrollExpanded(null); return; }
    setPayrollExpanded(key);
    if (payrollDetail[key]) return;
    setPayrollDetailLoading(key);
    try {
      const res = await api.get(`/hr/etp/payroll/summary/${row.month_number}/${row.year_number}`);
      const d = res?.data || res;
      setPayrollDetail(prev => ({ ...prev, [key]: d.employees || [] }));
    } catch { } finally { setPayrollDetailLoading(null); }
  };

  const payrollMonthName = m => new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' });

  /* ── PCV ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  const loadPcvs = async () => {
    setLoadingPcvs(true);
    try {
      const res = await api.get('/finance-cash/pcv/pending');
      const data = res?.data?.data || res?.data || [];
      setPcvs(Array.isArray(data) ? data.filter(p => p.status === 'pending_ceo') : []);
    } catch { } finally { setLoadingPcvs(false); }
  };
  const handleApprovePcv = async (pcv) => {
    setActionLoading(pcv.id);
    try {
      await api.put(`/finance-cash/pcv/${pcv.id}/approve`);
      showToast(`✅ ${pcv.pcv_number} approved!`, 'success');
      loadPcvs();
    } catch { showToast('Failed to approve PCV', 'error'); }
    finally { setActionLoading(null); }
  };
  const handleRejectPcv = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectTarget.id);
    try {
      await api.put(`/finance-cash/pcv/${rejectTarget.id}/reject`, { reason: rejectReason });
      showToast('PCV rejected.', 'error');
      loadPcvs(); setRejectTarget(null); setRejectReason('');
    } catch { showToast('Failed to reject PCV', 'error'); }
    finally { setActionLoading(null); }
  };

  const tabs = [
    { id: 'Overview',       label: '📊 Overview' },
    { id: 'PCV Approvals',  label: `💵 Petty Cash${pcvs.length > 0 ? ` (${pcvs.length})` : ''}` },
    { id: 'Fund Requests',  label: '📋 Fund Requests' },
    { id: 'Payroll Status', label: `👥 Payroll${payrollQueue.filter(q => q.payment_status === 'Pending Payment').length > 0 ? ` (${payrollQueue.filter(q => q.payment_status === 'Pending Payment').length})` : ''}` },
  ];

  const card = (sx = {}) => ({
    background: 'white', borderRadius: 16, padding: 24,
    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', ...sx
  });

  const th = { padding: '11px 14px', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '13px 14px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 13 };

  return (
    <div style={{ padding: 28, background: '#f0f4f8', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type === 'error' ? '#991b1b' : '#15803d', padding: '14px 20px', borderRadius: 10, fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', padding: 10, borderRadius: 12, display: 'flex', boxShadow: '0 4px 10px rgba(139,92,246,.3)' }}>
              <DollarSign color="white" size={24} />
            </span>
            Finance Command Center
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Live P&L, cash flow, receivables, payables & tax obligations</p>
        </div>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, color: '#334155', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => { setActiveTab(t.id); if (t.id === 'Payroll Status') fetchPayrollQueue(); if (t.id === 'Fund Requests') fetchFunds(); }}
            style={{ padding: '10px 20px', borderRadius: 99, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s', background: activeTab === t.id ? '#0f172a' : 'white', color: activeTab === t.id ? 'white' : '#64748b', border: `1px solid ${activeTab === t.id ? '#0f172a' : '#e2e8f0'}`, boxShadow: activeTab === t.id ? '0 4px 12px rgba(15,23,42,.15)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
      {activeTab === 'Overview' && (
        <>
          {finLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 16, color: '#64748b' }}>
              <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
              <p>Loading Financial Intelligence…</p>
            </div>
          ) : !finData ? (
            <div style={{ background: '#fee2e2', borderRadius: 16, padding: 32, color: '#b91c1c', fontWeight: 700 }}>Failed to load finance data.</div>
          ) : (
            <>
              {/* KPI Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }}>
                <KPICard label="Month Revenue"   value={fmt(finData.monthRevenue)} sub="All departments combined"    icon={TrendingUp}    gradient="linear-gradient(135deg,#1d4ed8,#3b82f6)" />
                <KPICard label="Month Expenses"  value={fmt(finData.monthExp)}     sub="Approved expenses this month" icon={TrendingDown}  gradient="linear-gradient(135deg,#b45309,#f59e0b)" />
                <KPICard label={finData.netProfit >= 0 ? 'Net Profit' : 'Net Loss'} value={fmt(Math.abs(finData.netProfit))} sub="Revenue minus expenses" icon={DollarSign} gradient={finData.netProfit >= 0 ? 'linear-gradient(135deg,#065f46,#10b981)' : 'linear-gradient(135deg,#be123c,#f43f5e)'} />
                <KPICard label="Pending Approvals" value={finData.pendingExpenses.count} sub={`${fmt(finData.pendingExpenses.total)} awaiting`} icon={Clock} gradient="linear-gradient(135deg,#4338ca,#6366f1)" />
              </div>

              {/* KPI Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }}>
                <KPICard label="Total Receivables" value={fmt(finData.totalReceivable)} sub="Customers owe us"         icon={ArrowUpRight}   gradient="linear-gradient(135deg,#0f766e,#14b8a6)" />
                <KPICard label="Total Payables"    value={fmt(finData.totalPayable)}    sub="We owe to suppliers"      icon={ArrowDownRight}  gradient="linear-gradient(135deg,#9d174d,#ec4899)" />
                <KPICard label="Cash In (Month)"   value={fmt(finData.cashInMonth)}     sub="Payments received"        icon={Landmark}        gradient="linear-gradient(135deg,#1e3a5f,#2563eb)" />
                <KPICard label="Tax Obligations"   value={fmt(finData.totalTaxOwed)}    sub={`VAT + WHT (YTD)`}        icon={ShieldCheck}     gradient="linear-gradient(135deg,#713f12,#d97706)" />
              </div>

              {/* Charts Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

                {/* Revenue/Expense/Profit Trend */}
                <div style={card()}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} /> 6-Month P&amp;L Trend
                  </h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={finData.revenueTrends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}   />
                          </linearGradient>
                          <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip formatter={v => fmt(v)} />
                        <Legend />
                        <Area type="monotone" dataKey="Revenue"  stroke="#3b82f6" fill="url(#gRev)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" fill="url(#gExp)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Profit"   stroke="#10b981" fill="url(#gPro)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Expense by Category */}
                <div style={card()}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingDown size={18} /> Expenses by Category
                  </h3>
                  {finData.expByCategory?.length === 0
                    ? <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 80 }}>No expenses this month.</p>
                    : (
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={finData.expByCategory} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11 }} />
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <Tooltip formatter={v => fmt(v)} />
                          <Bar dataKey="total" name="Amount" radius={[0, 4, 4, 0]}>
                            {finData.expByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Receivables / Payables / Tax row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>

                {/* Receivables */}
                <div style={card()}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowUpRight size={18} color="#10b981" /> Top Receivables
                  </h3>
                  {finData.receivableRows?.length === 0
                    ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>All customers paid!</p>
                    : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Customer</th><th style={{ ...th, textAlign: 'right' }}>Owed</th></tr></thead>
                      <tbody>
                        {finData.receivableRows.slice(0, 8).map((r, i) => (
                          <tr key={i}>
                            <td style={td}><span style={{ fontWeight: 700 }}>{r.name}</span><br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{r.phone || ''}</span></td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmt(r.current_balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Payables */}
                <div style={card()}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowDownRight size={18} color="#f43f5e" /> Supplier Payables
                  </h3>
                  {finData.payableRows?.length === 0
                    ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>No outstanding payables!</p>
                    : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Supplier</th><th style={{ ...th, textAlign: 'right' }}>Owed</th></tr></thead>
                      <tbody>
                        {finData.payableRows.map((r, i) => (
                          <tr key={i}>
                            <td style={td}><span style={{ fontWeight: 700 }}>{r.supplier_name || 'Unknown'}</span><br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{r.po_count} POs</span></td>
                            <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(r.owed)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Tax obligations */}
                <div style={card()}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#d97706" /> Tax Obligations (YTD)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                    {[
                      { label: 'VAT Collected',       value: finData.vatOwed,         color: '#3b82f6' },
                      { label: 'Withholding Tax',     value: finData.withholdingOwed, color: '#f59e0b' },
                      { label: 'Total Tax Obligation',value: finData.totalTaxOwed,    color: '#8b5cf6', bold: true },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, borderLeft: `4px solid ${item.color}` }}>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 15, fontWeight: item.bold ? 800 : 700, color: item.color }}>{fmt(item.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#fefce8', borderRadius: 10, border: '1px solid #fde047', fontSize: 12, color: '#92400e' }}>
                    ⚠️ Consult your tax advisor to confirm filing deadlines.
                  </div>
                </div>
              </div>

              {/* Recent Transactions ledger */}
              <div style={card()}>
                <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} /> Recent Transactions Ledger
                </h3>
                {finData.recentTransactions?.length === 0
                  ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>No transactions recorded yet.</p>
                  : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={th}>#</th>
                        <th style={th}>Type</th>
                        <th style={th}>Department / Category</th>
                        <th style={th}>By</th>
                        <th style={th}>Date</th>
                        <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finData.recentTransactions.map((t, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                          <td style={td}>{i + 1}</td>
                          <td style={td}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.direction === 'Income' ? '#059669' : '#dc2626', fontWeight: 700 }}>
                              {t.direction === 'Income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {t.direction}
                            </span>
                          </td>
                          <td style={td}>{t.dept || '—'}</td>
                          <td style={td}>{t.by || '—'}</td>
                          <td style={td}>{fmtDate(t.date)}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: t.direction === 'Income' ? '#059669' : '#dc2626' }}>
                            {t.direction === 'Income' ? '+' : '-'}{fmt(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════ PCV APPROVALS TAB ══════════════ */}
      {activeTab === 'PCV Approvals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}><Banknote size={22} color="#eab308" /> Pending Petty Cash Vouchers</h2>
            <button onClick={loadPcvs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><RefreshCw size={14} /> Refresh</button>
          </div>
          {loadingPcvs ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><SegmentedSpinner size={32} /><div>Loading pending PCVs...</div></div>
          ) : pcvs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>All Clear!</h3>
              <p style={{ color: '#64748b', margin: 0 }}>No PCV vouchers are awaiting your approval.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pcvs.map(pcv => (
                <div key={pcv.id} style={{ background: 'white', borderRadius: 16, border: `2px solid ${expandedPcv === pcv.id ? '#eab308' : '#e2e8f0'}`, boxShadow: expandedPcv === pcv.id ? '0 8px 20px rgba(234,179,8,.12)' : '0 2px 6px rgba(0,0,0,.04)', overflow: 'hidden', transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: 16 }}>
                    <div style={{ flexShrink: 0, background: '#fefce8', padding: 12, borderRadius: 12, border: '1px solid #fde047' }}><Banknote size={24} color="#eab308" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{pcv.pcv_number}</span>
                        <span style={{ background: '#fef9c3', color: '#a16207', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Awaiting CEO</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
                        <span><b style={{ color: '#0f172a' }}>To:</b> {pcv.paid_to}</span>
                        <span>·</span><span>{new Date(pcv.date).toLocaleDateString('en-GB')}</span>
                        <span>·</span><span style={{ fontWeight: 800, color: '#a16207' }}>ETB {parseFloat(pcv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setExpandedPcv(expandedPcv === pcv.id ? null : pcv.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#475569' }}>
                        <Eye size={14} /> {expandedPcv === pcv.id ? 'Hide' : 'View'} {expandedPcv === pcv.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => setRejectTarget(pcv)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#dc2626' }}><XCircle size={14} /> Reject</button>
                      <button onClick={() => handleApprovePcv(pcv)} disabled={actionLoading === pcv.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'white', boxShadow: '0 2px 8px rgba(34,197,94,.3)', opacity: actionLoading === pcv.id ? 0.7 : 1 }}>
                        {actionLoading === pcv.id ? <SegmentedSpinner size={14} /> : <CheckCircle size={14} />} Approve
                      </button>
                    </div>
                  </div>
                  {expandedPcv === pcv.id && <PCVDetailPanel pcv={pcv} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ FUND REQUESTS TAB ══════════════ */}
      {activeTab === 'Fund Requests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}><FileText size={22} color="#3b82f6" /> Pending Income Submissions</h2>
            <button onClick={fetchFunds} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><RefreshCw size={14} /> Refresh</button>
          </div>
          {fundsLoading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}><SegmentedSpinner size={32} /></div>
          ) : funds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px', fontWeight: 700 }}>No Pending Fund Requests</h3>
              <p style={{ color: '#64748b', margin: 0 }}>All income submissions have been processed.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['ID', 'Department', 'Submitted By', 'Submission Date', 'Amount', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {funds.map((f, i) => (
                    <tr key={i}>
                      <td style={{ ...td, fontWeight: 700 }}>{f.id}</td>
                      <td style={td}>{f.department_source || f.dept || '—'}</td>
                      <td style={td}>{f.submitted_by_name || '—'}</td>
                      <td style={td}>{fmtDate(f.submission_date)}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{fmt(f.total_amount)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>{f.status || 'PENDING'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ PAYROLL STATUS TAB ══════════════ */}
      {activeTab === 'Payroll Status' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}><Users size={22} color="#16a34a" /> Payroll Payment Status</h2>
            <button onClick={fetchPayrollQueue} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><RefreshCw size={14} /> Refresh</button>
          </div>
          {payrollLoading ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}><SegmentedSpinner size={32} /><div style={{ marginTop: 12, color: '#94a3b8' }}>Loading payroll status...</div></div>
          ) : payrollQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px', fontWeight: 700 }}>No Payrolls Found</h3>
              <p style={{ color: '#64748b', margin: 0 }}>Approved payrolls will appear here once HR submits them.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {payrollQueue.map(row => {
                const key       = `${row.month_number}-${row.year_number}`;
                const isExp     = payrollExpanded === key;
                const emps      = payrollDetail[key] || [];
                const isPending = row.payment_status === 'Pending Payment';
                const isFullyPaid = row.payment_status === 'Paid';
                const paidCount = isFullyPaid ? emps.length : emps.filter(e => e.payment_status === 'Paid').length;
                const allPaid   = isFullyPaid || (emps.length > 0 && paidCount === emps.length);
                return (
                  <div key={key} style={{ background: 'white', borderRadius: 16, border: `2px solid ${allPaid ? '#bbf7d0' : '#fde68a'}`, boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flexShrink: 0, background: allPaid ? '#f0fdf4' : '#fefce8', padding: 12, borderRadius: 12, border: `1px solid ${allPaid ? '#86efac' : '#fde047'}` }}><Users size={24} color={allPaid ? '#16a34a' : '#eab308'} /></div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{payrollMonthName(row.month_number)} {row.year_number} Payroll</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{row.total_employees} employees — Net: <strong style={{ color: '#0f172a' }}>{formatCurrency ? formatCurrency(row.total_net_pay) : `ETB ${parseFloat(row.total_net_pay || 0).toLocaleString()}`}</strong></div>
                        {emps.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', width: 200 }}>
                              <div style={{ height: '100%', width: `${(paidCount / emps.length) * 100}%`, background: allPaid ? '#16a34a' : '#3b82f6', borderRadius: 99, transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: allPaid ? '#f0fdf4' : emps.length > 0 ? '#eff6ff' : '#f8fafc', padding: '10px 22px', borderRadius: 12, border: `2px solid ${allPaid ? '#86efac' : emps.length > 0 ? '#bfdbfe' : '#e2e8f0'}`, minWidth: 80 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: allPaid ? '#16a34a' : emps.length > 0 ? '#2563eb' : '#94a3b8', lineHeight: 1 }}>{emps.length > 0 ? `${paidCount}/${emps.length}` : `?/${row.total_employees || '?'}`}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: allPaid ? '#15803d' : emps.length > 0 ? '#1d4ed8' : '#94a3b8', textTransform: 'uppercase', marginTop: 3 }}>Paid</div>
                      </div>
                      {allPaid ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#dcfce7', color: '#16a34a', border: '1.5px solid #16a34a' }}><CheckCircle size={14} /> Paid</span>
                      ) : isPending ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#FEF3C7', color: '#92400E', border: '1.5px solid #D97706' }}><Clock size={14} /> Awaiting Finance</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, background: '#dcfce7', color: '#15803d' }}><CheckCircle size={14} /> Completed</span>
                      )}
                      <button onClick={() => loadPayrollDetail(row)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#475569' }}>
                        <Eye size={14} /> {isExp ? 'Hide' : 'Detail'} {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    {isExp && (
                      <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '16px 24px' }}>
                        {payrollDetailLoading === key ? (
                          <div style={{ textAlign: 'center', padding: 24 }}><SegmentedSpinner size={28} /></div>
                        ) : emps.length === 0 ? (
                          <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>No employee data available yet.</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}><span style={{ color: '#16a34a', fontWeight: 800 }}>{paidCount}</span> / {emps.length} employees paid</div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead><tr style={{ background: '#f1f5f9' }}>
                                {['#', 'Employee', 'Department', 'Payment Method', 'Net Pay', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Net Pay' ? 'right' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
                              </tr></thead>
                              <tbody>
                                {emps.map((e, idx) => {
                                  const isPaid   = row.payment_status === 'Paid' || e.payment_status === 'Paid';
                                  const hasBank  = e.bank_account_number || e.bank_name;
                                  const isCash   = (e.payment_method || '').toLowerCase().includes('cash');
                                  return (
                                    <tr key={e.employee_id} style={{ borderBottom: '1px solid #f1f5f9', background: isPaid ? '#f0fdf4' : idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 12 }}>{idx + 1}</td>
                                      <td style={{ padding: '10px 14px' }}><div style={{ fontWeight: 600, color: '#0f172a' }}>{e.full_name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>#{e.employee_id}</div></td>
                                      <td style={{ padding: '10px 14px', color: '#475569' }}>{e.department || e.position || '—'}</td>
                                      <td style={{ padding: '10px 14px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: isCash ? '#92400e' : '#0369a1', textTransform: 'uppercase' }}>{isCash ? '💵 Cash' : '🏦 Bank'}</div>
                                        {hasBank && !isCash && <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{e.bank_name} - {e.bank_account_number}</div>}
                                      </td>
                                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>ETB {parseFloat(e.net_pay || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      <td style={{ padding: '10px 14px' }}>
                                        {isPaid
                                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d' }}><CheckCircle size={11} /> Paid</span>
                                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}><Clock size={11} /> Pending</span>
                                        }
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject PCV Modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>Reject PCV</h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>You are rejecting <b style={{ color: '#dc2626' }}>{rejectTarget.pcv_number}</b>.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={4} style={{ width: '100%', padding: '12px 14px', border: '2px solid #fca5a5', borderRadius: 10, boxSizing: 'border-box', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleRejectPcv} disabled={!rejectReason.trim() || actionLoading === rejectTarget.id} style={{ padding: '10px 20px', background: !rejectReason.trim() ? '#fca5a5' : '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: !rejectReason.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {actionLoading === rejectTarget.id ? <SegmentedSpinner size={16} /> : <XCircle size={16} />} Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CEOFinance;
