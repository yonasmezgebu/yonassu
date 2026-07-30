import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Download, CheckCircle, Clock, Wallet, Banknote,
  FileText, X, Leaf, TrendingUp, Package, ChevronDown, AlertCircle,
  Eye, Printer, Award, RefreshCw
} from 'lucide-react';
import { financeState } from '../../utils/financeTransactionService';
import api from '../../services/apiClient';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  forestGreen:  '#228B22',
  darkGreen:    '#1B5E20',
  emerald:      '#2E8B57',
  leafGreen:    '#4CAF50',
  sage:         '#A5D6A7',
  olive:        '#6B8E23',
  mint:         '#E8F5E9',
  lime:         '#8BC34A',
  earthBrown:   '#8D6E63',
  skyBlue:      '#87CEEB',
  white:        '#FFFFFF',
  lightGray:    '#F5F5F5',
  darkGray:     '#424242',
  orange:       '#FF9800',
  red:          '#F44336',
};

// ─── In-App Toast ─────────────────────────────────────────────────────────────
let _toastId = 0;
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = id => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, push, remove };
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    APPROVED:         { bg: '#FFF3E0', color: C.orange,     label: 'Approved' },
    READY_FOR_PAYMENT:{ bg: '#E8F5E9', color: C.forestGreen, label: 'Ready for Payment' },
    PAID:             { bg: '#E8F5E9', color: C.darkGreen,   label: 'Paid' },
    PENDING:          { bg: '#FFF9C4', color: C.olive,       label: 'Pending' },
    REJECTED:         { bg: '#FFEBEE', color: C.red,         label: 'Rejected' },
  };
  const s = map[status] || { bg: C.lightGray, color: C.darkGray, label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', fontSize: 11,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
      background: s.bg, color: s.color, border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, accent }) => (
  <div style={{
    background: C.white, borderLeft: `4px solid ${accent}`,
    border: `1px solid ${C.sage}`, borderLeft: `5px solid ${accent}`,
    padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{
      width: 48, height: 48, background: `${accent}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.darkGray, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.darkGreen }}>{value}</div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FinanceProcurement = () => {
  const [filter, setFilter]             = useState('All');
  const [activeTab, setActiveTab]       = useState('internal');
  const [fundRequests, setFundRequests] = useState([]);
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [viewFundRequest, setViewFundRequest] = useState(null);
  const { toasts, push, remove }        = useToast();

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const [fundRes, payRes] = await Promise.all([
        api.get('/public-procurement/fund-requests'),
        api.get('/public-procurement/payments'),
      ]);
      setFundRequests(Array.isArray(fundRes?.data ?? fundRes) ? (fundRes?.data ?? fundRes) : []);
      setPayments(Array.isArray(payRes?.data ?? payRes) ? (payRes?.data ?? payRes) : []);
    } catch (err) {
      push('Failed to load procurement data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPublicData(); }, []);

  const handleVerifyBudget = async (id) => {
    try {
      await api.put(`/public-procurement/fund-requests/${id}/verify`);
      push('Budget verified — marked as Ready for Payment.');
      fetchPublicData();
    } catch (err) {
      push('Error verifying budget: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const handleCreatePayment = async (id) => {
    try {
      await api.post('/public-procurement/payments', { fundRequestId: id });
      push('Payment created successfully.');
      fetchPublicData();
    } catch (err) {
      push('Error creating payment: ' + (err?.response?.data?.message || err.message), 'error');
    }
  };

  const procurements = financeState.procurements || [];
  const filteredProcurements = procurements.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return p.status?.includes('Pending');
    if (filter === 'Approved') return ['Approved','Received','Sent'].includes(p.status);
    return p.type === filter;
  });

  // Summary stats
  const totalFunds    = fundRequests.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const readyCount    = fundRequests.filter(r => r.status === 'READY_FOR_PAYMENT').length;
  const totalPayments = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  const TABS = [
    { id: 'internal',        label: 'Internal Procurement',   icon: <FileText size={15} /> },
    { id: 'public_funds',    label: 'Public Fund Requests',   icon: <Wallet size={15} /> },
    { id: 'public_payments', label: 'Public Payments',        icon: <Banknote size={15} /> },
  ];

  const FILTERS = ['All','Pending','Approved','Requisition','Fund Request','Purchase Order','Goods Received Note'];

  return (
    <div style={{ background: C.lightGray, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", width: '100%' }}>

      {/* ── Toast Container ─────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? '#FFEBEE' : '#E8F5E9',
            color:      t.type === 'error' ? C.red        : C.darkGreen,
            border:     `1px solid ${t.type === 'error' ? C.red : C.leafGreen}`,
            padding: '12px 16px', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
              {t.msg}
            </span>
            <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: C.darkGreen, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: C.forestGreen, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={22} color={C.white} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.white, letterSpacing: '0.3px' }}>
              PROCUREMENT FINANCE
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: C.sage, marginTop: 2 }}>
              Financial oversight of procurement flows & public tender bids
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => fetchPublicData()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: C.forestGreen, color: C.white, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'transparent', color: C.sage, border: `1px solid ${C.emerald}`, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* ── Summary Cards ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <SummaryCard label="Total Fund Requests" value={`ETB ${totalFunds.toLocaleString()}`} icon={<Wallet size={22} color={C.forestGreen} />} accent={C.forestGreen} />
          <SummaryCard label="Ready for Payment" value={readyCount} icon={<CheckCircle size={22} color={C.emerald} />} accent={C.emerald} />
          <SummaryCard label="Total Payments Made" value={`ETB ${totalPayments.toLocaleString()}`} icon={<TrendingUp size={22} color={C.olive} />} accent={C.olive} />
          <SummaryCard label="Internal Procurement" value={procurements.length} icon={<Package size={22} color={C.earthBrown} />} accent={C.earthBrown} />
        </div>

        {/* ── Budget Utilization Bars ─────────────────────────────────────── */}
        <div style={{ background: C.white, border: `1px solid ${C.sage}`, borderTop: `4px solid ${C.forestGreen}`, padding: '20px 24px', marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.darkGreen, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} color={C.forestGreen} /> Budget Utilization
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { department: 'Pharmacy',    allocated: 500000, spent: 345000 },
              { department: 'Laboratory',  allocated: 300000, spent: 120000 },
              { department: 'Admin',       allocated: 150000, spent: 145000 },
            ].map(b => {
              const pct = Math.min(100, (b.spent / b.allocated) * 100);
              const over = pct >= 90;
              return (
                <div key={b.department} style={{ border: `1px solid ${C.sage}`, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.darkGreen }}>{b.department}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: over ? C.red : C.forestGreen }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: C.mint, marginBottom: 10 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: over ? C.red : C.forestGreen, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: C.darkGray }}>Spent: <strong>ETB {b.spent.toLocaleString()}</strong></span>
                    <span style={{ color: over ? C.red : C.emerald, fontWeight: 700 }}>
                      Rem: ETB {(b.allocated - b.spent).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `2px solid ${C.sage}` }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '11px 22px', border: 'none', cursor: 'pointer', fontWeight: 700,
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 7,
                background: activeTab === tab.id ? C.forestGreen : 'transparent',
                color:      activeTab === tab.id ? C.white       : C.darkGray,
                borderBottom: activeTab === tab.id ? `3px solid ${C.darkGreen}` : '3px solid transparent',
                marginBottom: -2, transition: 'background 0.15s, color 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — INTERNAL PROCUREMENT
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'internal' && (
          <div style={{ background: C.white, border: `1px solid ${C.sage}` }}>
            {/* Filter Bar */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.sage}`, display: 'flex', flexWrap: 'wrap', gap: 8, background: C.mint }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    border: `2px solid ${filter === f ? C.forestGreen : C.sage}`,
                    background: filter === f ? C.forestGreen : C.white,
                    color: filter === f ? C.white : C.darkGray,
                    transition: 'all 0.15s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.darkGreen }}>
                    {['Reference ID', 'Type', 'Date', 'Dept / Supplier', 'Details', 'Amount (ETB)', 'Status'].map((col, i) => (
                      <th key={col} style={{
                        padding: '12px 16px', textAlign: i >= 5 ? 'right' : 'left',
                        color: C.white, fontWeight: 700, fontSize: 12,
                        textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProcurements.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.sage}`, background: idx % 2 === 0 ? C.white : C.mint }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.darkGreen }}>{p.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', background: C.mint, color: C.darkGreen, fontSize: 11, fontWeight: 700, border: `1px solid ${C.sage}` }}>{p.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: C.darkGray }}>{p.requestDate || p.poDate || p.grnDate}</td>
                      <td style={{ padding: '12px 16px', color: C.darkGray, fontWeight: 600 }}>{p.department || p.supplier}</td>
                      <td style={{ padding: '12px 16px', color: C.darkGray, fontSize: 12 }}>
                        {p.item && <span>Item: {p.item}</span>}
                        {p.poReference && <span>Ref: {p.poReference}</span>}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: C.darkGreen }}>
                        {(p.requestedAmount || p.totalAmount) ? (p.requestedAmount || p.totalAmount).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', fontSize: 11, fontWeight: 700,
                          background: p.status?.includes('Pending') ? '#FFF3E0' : '#E8F5E9',
                          color:      p.status?.includes('Pending') ? C.orange  : C.forestGreen,
                          border: `1px solid ${p.status?.includes('Pending') ? C.orange : C.leafGreen}33`,
                        }}>
                          {p.status?.includes('Pending') ? <Clock size={11} /> : <CheckCircle size={11} />}
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredProcurements.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.earthBrown, fontWeight: 600 }}>
                        No records found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — PUBLIC FUND REQUESTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'public_funds' && (
          <div style={{ background: C.white, border: `1px solid ${C.sage}` }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.darkGreen }}>
                    {['Request No.', 'Total Amount (ETB)', 'Status', 'Date', 'Action'].map((col, i) => (
                      <th key={col} style={{
                        padding: '12px 16px', textAlign: i === 1 ? 'right' : 'left',
                        color: C.white, fontWeight: 700, fontSize: 12,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: C.earthBrown, fontWeight: 600 }}>Loading data…</td></tr>
                  ) : fundRequests.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: C.earthBrown, fontWeight: 600 }}>No fund requests found.</td></tr>
                  ) : fundRequests.map((req, idx) => (
                    <tr key={req.id} style={{ borderBottom: `1px solid ${C.sage}`, background: idx % 2 === 0 ? C.white : C.mint }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.darkGreen }}>{req.request_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.forestGreen, textAlign: 'right' }}>
                        {Number(req.total_amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge status={req.status} />
                      </td>
                      <td style={{ padding: '12px 16px', color: C.darkGray }}>
                        {new Date(req.created_at).toLocaleDateString('en-CA')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => setViewFundRequest(req)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: C.forestGreen, color: C.white, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                        >
                          <Eye size={13} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — PUBLIC PAYMENTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'public_payments' && (
          <div style={{ background: C.white, border: `1px solid ${C.sage}` }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.darkGreen }}>
                    {['Receipt Code', 'Fund Request', 'Amount (ETB)', 'Status', 'Paid At'].map((col, i) => (
                      <th key={col} style={{
                        padding: '12px 16px', textAlign: i === 2 ? 'right' : 'left',
                        color: C.white, fontWeight: 700, fontSize: 12,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: C.earthBrown, fontWeight: 600 }}>Loading payments…</td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: C.earthBrown, fontWeight: 600 }}>No payments found.</td></tr>
                  ) : payments.map((pay, idx) => (
                    <tr key={pay.id} style={{ borderBottom: `1px solid ${C.sage}`, background: idx % 2 === 0 ? C.white : C.mint }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.darkGreen }}>{pay.receipt_code}</td>
                      <td style={{ padding: '12px 16px', color: C.darkGray }}>{pay.request_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.forestGreen, textAlign: 'right' }}>
                        {Number(pay.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge status={pay.status || 'PAID'} />
                      </td>
                      <td style={{ padding: '12px 16px', color: C.darkGray }}>
                        {new Date(pay.paid_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — Fund Request Details
      ══════════════════════════════════════════════════════════════════════ */}
      {viewFundRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,94,32,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1050, overflowY: 'auto', padding: '40px 20px' }}>
          <div style={{ background: C.white, width: '100%', maxWidth: 680, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div style={{ background: C.darkGreen, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.white }}>Fund Request Details</h3>
                <p style={{ margin: '3px 0 0', color: C.sage, fontSize: 12 }}>
                  {viewFundRequest.request_code} &bull; {new Date(viewFundRequest.created_at).toLocaleDateString('en-CA')}
                </p>
              </div>
              <button
                onClick={() => setViewFundRequest(null)}
                style={{ background: C.forestGreen, border: 'none', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color={C.white} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Summary Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ background: C.mint, border: `1px solid ${C.sage}`, padding: '16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.olive, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total Amount Required</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.darkGreen }}>
                    ETB {Number(viewFundRequest.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: C.mint, border: `1px solid ${C.sage}`, padding: '16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.olive, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Status</div>
                  <div style={{ marginTop: 4 }}><Badge status={viewFundRequest.status} /></div>
                </div>
              </div>

              {/* Included Tenders */}
              <div style={{ fontSize: 13, fontWeight: 800, color: C.darkGreen, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={15} color={C.forestGreen} /> Included Awarded Tenders
              </div>

              <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {viewFundRequest.items?.map(item => (
                  <div key={item.id} style={{ border: `1px solid ${C.sage}`, background: C.white }}>
                    {/* Tender Header */}
                    <div style={{ padding: '12px 16px', background: C.mint, borderBottom: `1px solid ${C.sage}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: C.darkGreen, fontSize: 14 }}>{item.tender_title}</div>
                        <div style={{ color: C.earthBrown, fontSize: 12, marginTop: 2 }}>
                          Supplier: <strong style={{ color: C.darkGray }}>{item.supplier}</strong>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: C.forestGreen, fontSize: 16 }}>
                        ETB {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Products Table */}
                    {item.products && item.products.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: C.darkGreen }}>
                            {['Item Name', 'Qty', 'Unit Price (ETB)', 'Total (ETB)'].map((h, i) => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: i >= 1 ? 'right' : 'left', color: C.white, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.products.map((prod, idx) => {
                            const unitPrice   = prod.price_birr + (prod.price_cent / 100);
                            const totalAmount = prod.total_birr + (prod.total_cent / 100);
                            return (
                              <tr key={idx} style={{ borderBottom: `1px solid ${C.sage}`, background: idx % 2 === 0 ? C.white : C.mint }}>
                                <td style={{ padding: '8px 12px', color: C.darkGray, fontWeight: 500 }}>{prod.item_name}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.darkGray }}>{prod.quantity}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.darkGray }}>{Number(unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.darkGreen, fontWeight: 700 }}>{Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: C.forestGreen }}>
                            <td colSpan={3} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: C.white, fontSize: 12 }}>SUBTOTAL</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800, color: C.white }}>
                              {Number(item.products.reduce((a, p) => a + p.total_birr + (p.total_cent / 100), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div style={{ padding: '14px 16px', fontSize: 12, color: C.earthBrown, fontStyle: 'italic' }}>No itemized products for this tender.</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {viewFundRequest.status === 'APPROVED' && (
                <button
                  onClick={() => { handleVerifyBudget(viewFundRequest.id); setViewFundRequest(null); }}
                  style={{ width: '100%', padding: '14px', background: C.forestGreen, color: C.white, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <CheckCircle size={16} /> Verify Budget &amp; Mark Ready for Payment
                </button>
              )}
              {viewFundRequest.status === 'READY_FOR_PAYMENT' && (
                <button
                  onClick={() => { handleCreatePayment(viewFundRequest.id); setViewFundRequest(null); }}
                  style={{ width: '100%', padding: '14px', background: C.emerald, color: C.white, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Banknote size={16} /> Create Final Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceProcurement;
