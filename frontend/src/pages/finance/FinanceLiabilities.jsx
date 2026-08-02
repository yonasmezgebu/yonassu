import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Building2, Landmark, FileText, Users, History,
  X, CheckCircle, AlertCircle, RefreshCw, Trash2, CreditCard, TrendingDown
} from 'lucide-react';
import apiClient from '../../services/apiClient';

/* ─── Color Palette ────────────────────────────────────────────── */
const C = {
  forest:     '#228B22',
  darkGreen:  '#1B5E20',
  emerald:    '#2E8B57',
  leafGreen:  '#4CAF50',
  sage:       '#A5D6A7',
  olive:      '#6B8E23',
  mint:       '#F1F8F1',
  lime:       '#8BC34A',
  earthBrown: '#8D6E63',
  skyBlue:    '#87CEEB',
  white:      '#FFFFFF',
  lightGray:  '#F5F5F5',
  darkGray:   '#424242',
  orange:     '#FF9800',
  red:        '#F44336',
  border:     '#C8E6C9',
};

/* ─── Global Styles ────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }

  .ll-wrap {
    font-family: 'Inter', sans-serif;
    background: ${C.lightGray};
    min-height: 100vh;
    width: 100%;
    color: ${C.darkGray};
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .ll-header {
    width: 100%;
    background: ${C.darkGreen};
    padding: 0.9rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid ${C.forest};
    flex-shrink: 0;
  }
  .ll-header-left { display: flex; flex-direction: column; gap: 2px; }
  .ll-title {
    font-size: 1.4rem;
    font-weight: 900;
    color: ${C.white};
    display: flex;
    align-items: center;
    gap: 0.6rem;
    letter-spacing: -0.3px;
    text-transform: uppercase;
  }
  .ll-title svg { color: ${C.sage}; flex-shrink: 0; }
  .ll-subtitle {
    font-size: 0.72rem;
    font-weight: 600;
    color: ${C.sage};
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding-left: 2px;
  }

  /* ── Sync Button ── */
  .ll-btn-sync {
    background: transparent;
    border: 2px solid rgba(255,255,255,0.4);
    color: ${C.white};
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    transition: background 0.18s, border-color 0.18s, transform 0.15s;
    white-space: nowrap;
  }
  .ll-btn-sync:hover {
    background: rgba(255,255,255,0.12);
    border-color: ${C.sage};
    transform: translateY(-1px);
  }
  .ll-btn-sync.spinning svg { animation: ll-spin 0.9s linear infinite; }
  @keyframes ll-spin { to { transform: rotate(360deg); } }

  /* ── Tab Navigation ── */
  .ll-tabs {
    width: 100%;
    display: flex;
    background: ${C.white};
    border-bottom: 2.5px solid ${C.border};
    overflow-x: auto;
    flex-shrink: 0;
    scrollbar-width: none;
  }
  .ll-tabs::-webkit-scrollbar { display: none; }
  .ll-tab {
    padding: 0.9rem 1.2rem;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #757575;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: color 0.18s, background 0.18s, border-color 0.18s;
    flex-shrink: 0;
  }
  .ll-tab:hover { color: ${C.forest}; background: ${C.mint}; }
  .ll-tab.active { color: ${C.forest}; border-bottom-color: ${C.forest}; background: ${C.mint}; }

  /* ── Content Area ── */
  .ll-body {
    width: 100%;
    flex: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* ── Dashboard Cards ── */
  .ll-stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 1rem;
    width: 100%;
  }
  .ll-stat-hero {
    grid-column: 1 / -1;
    background: ${C.forest} !important;
    border: 2.5px solid ${C.darkGreen} !important;
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.18s;
    color: ${C.white} !important;
  }
  .ll-stat-card.ll-stat-hero:hover { background: ${C.darkGreen}; }
  .ll-stat-card.ll-stat-hero .ll-card-label { color: ${C.sage} !important; font-size: 0.78rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .ll-stat-card.ll-stat-hero .ll-card-val { color: ${C.white} !important; font-size: 2.4rem; font-weight: 900; letter-spacing: -1px; margin-top: 4px; }
  .ll-stat-card.ll-stat-hero .ll-card-icon { color: rgba(255,255,255,0.25); }

  .ll-stat-card {
    background: ${C.white};
    border: 2px solid ${C.border};
    padding: 1.2rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
    cursor: default;
  }
  .ll-stat-card:hover {
    border-color: ${C.leafGreen};
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(34,139,34,0.1);
  }
  .ll-card-label { font-size: 0.72rem; font-weight: 700; color: #757575; text-transform: uppercase; letter-spacing: 0.8px; }
  .ll-card-val { font-size: 1.5rem; font-weight: 900; color: ${C.forest}; letter-spacing: -0.5px; margin-top: 4px; }
  .ll-card-val.danger { color: ${C.red}; }
  .ll-card-strip { height: 3px; background: ${C.leafGreen}; margin-top: 0.6rem; }
  .ll-card-strip.danger { background: ${C.red}; }

  /* ── Action bar ── */
  .ll-action-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* ── Primary Button ── */
  .ll-btn {
    background: ${C.forest};
    color: ${C.white};
    border: 2.5px solid ${C.forest};
    padding: 0.65rem 1.4rem;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.82rem;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
    white-space: nowrap;
  }
  .ll-btn:hover {
    background: ${C.darkGreen};
    border-color: ${C.darkGreen};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(27,94,32,0.25);
  }
  .ll-btn:disabled { opacity: 0.52; cursor: not-allowed; transform: none; box-shadow: none; }
  .ll-btn.outline {
    background: transparent;
    color: ${C.darkGray};
    border-color: #bdbdbd;
  }
  .ll-btn.outline:hover { background: ${C.lightGray}; border-color: #9e9e9e; transform: none; box-shadow: none; }
  .ll-btn.pay-btn {
    background: ${C.emerald};
    border-color: ${C.emerald};
    padding: 0.3rem 0.7rem;
    font-size: 0.72rem;
  }
  .ll-btn.pay-btn:hover { background: ${C.forest}; border-color: ${C.forest}; }
  .ll-btn.del-btn {
    background: ${C.red};
    border-color: ${C.red};
    padding: 0.3rem 0.55rem;
    font-size: 0.72rem;
  }
  .ll-btn.del-btn:hover { background: #c62828; border-color: #c62828; }

  /* ── Table ── */
  .ll-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 2px solid ${C.border};
    background: ${C.white};
  }
  .ll-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }
  .ll-thead { background: ${C.forest}; }
  .ll-th {
    padding: 0.85rem 1rem;
    color: ${C.white};
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    text-align: left;
    border-right: 1px solid rgba(255,255,255,0.15);
  }
  .ll-th:last-child { border-right: none; }
  .ll-tbody tr { transition: background 0.15s; border-bottom: 1px solid ${C.border}; }
  .ll-tbody tr:hover { background: ${C.mint}; }
  .ll-tbody tr:last-child { border-bottom: none; }
  .ll-td {
    padding: 0.85rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: ${C.darkGray};
    vertical-align: middle;
  }
  .ll-td.mono { font-family: monospace; font-weight: 700; font-size: 0.8rem; }
  .ll-td.amount { font-weight: 800; color: ${C.darkGreen}; }
  .ll-td.balance-due { font-weight: 800; color: ${C.red}; }
  .ll-td.balance-ok { font-weight: 800; color: ${C.forest}; }
  .ll-td-actions { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }
  .ll-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: #9e9e9e;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .ll-empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }

  /* ── Status Badge ── */
  .ll-badge {
    display: inline-block;
    padding: 3px 9px;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: ${C.white};
    white-space: nowrap;
  }
  .ll-badge.paid    { background: ${C.leafGreen}; }
  .ll-badge.partial { background: ${C.orange}; }
  .ll-badge.overdue { background: ${C.red}; }
  .ll-badge.pending { background: ${C.skyBlue}; color: ${C.darkGray}; }

  /* ── Modal ── */
  .ll-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(3px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 1000;
    padding: 1rem;
    overflow-y: auto;
  }
  .ll-modal {
    background: ${C.white};
    width: 100%;
    max-width: 580px;
    border: 2.5px solid ${C.forest};
    margin: auto;
    overflow: hidden;
  }
  .ll-modal-head {
    background: ${C.darkGreen};
    padding: 1rem 1.4rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ll-modal-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: ${C.white};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .ll-modal-close {
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.3);
    color: ${C.white};
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    display: flex;
    align-items: center;
    transition: background 0.15s;
  }
  .ll-modal-close:hover { background: rgba(255,255,255,0.25); }
  .ll-modal-body { padding: 1.4rem; }

  /* ── Balance info strip in pay modal ── */
  .ll-balance-strip {
    background: ${C.mint};
    border: 2px solid ${C.leafGreen};
    padding: 1rem 1.2rem;
    margin-bottom: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ll-balance-strip .lbl { font-size: 0.7rem; font-weight: 700; color: ${C.forest}; text-transform: uppercase; letter-spacing: 0.8px; }
  .ll-balance-strip .val { font-size: 1.5rem; font-weight: 900; color: ${C.darkGray}; }
  .ll-balance-strip .meta { font-size: 0.78rem; color: ${C.olive}; font-weight: 600; }

  /* ── Form Fields ── */
  .ll-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .ll-form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
  .ll-form-group:last-child { margin-bottom: 0; }
  .ll-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: ${C.darkGray};
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }
  .ll-input, .ll-select {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 2px solid #bdbdbd;
    background: ${C.white};
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    color: ${C.darkGray};
    transition: border-color 0.18s, box-shadow 0.18s;
    outline: none;
    appearance: auto;
  }
  .ll-input:focus, .ll-select:focus {
    border-color: ${C.forest};
    border-width: 2.5px;
    box-shadow: 0 0 0 3px rgba(34,139,34,0.1);
  }
  .ll-input::placeholder { color: #bdbdbd; }
  .ll-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1.5px solid ${C.border};
    flex-wrap: wrap;
  }

  /* ── Toast ── */
  .ll-toasts {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    z-index: 9000;
    pointer-events: none;
  }
  .ll-toast {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.8rem 1.2rem;
    background: ${C.darkGreen};
    color: ${C.white};
    border-left: 4px solid ${C.leafGreen};
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    animation: ll-slidein 0.28s cubic-bezier(0.16,1,0.3,1);
    min-width: 260px;
    max-width: 380px;
    pointer-events: all;
  }
  .ll-toast.error { background: #b71c1c; border-left-color: ${C.red}; }
  @keyframes ll-slidein { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .ll-stat-grid { grid-template-columns: 1fr 1fr 1fr; }
    .ll-stat-hero { grid-column: 1 / -1; }
  }
  @media (max-width: 768px) {
    .ll-header { padding: 0.75rem 1rem; }
    .ll-title { font-size: 1.1rem; }
    .ll-body { padding: 1rem; gap: 1rem; }
    .ll-stat-grid { grid-template-columns: 1fr 1fr; }
    .ll-stat-hero .ll-card-val { font-size: 1.6rem; }
    .ll-tab { padding: 0.75rem 0.9rem; font-size: 0.72rem; }
    .ll-form-grid { grid-template-columns: 1fr; }
    .ll-modal { max-width: 100%; margin: 0; }
    .ll-btn-sync span { display: none; }
  }
  @media (max-width: 480px) {
    .ll-stat-grid { grid-template-columns: 1fr; }
    .ll-title { font-size: 1rem; }
    .ll-action-bar { justify-content: stretch; }
    .ll-btn { width: 100%; justify-content: center; }
  }
`;

/* ─── Sub-components ────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  let cls = 'pending';
  if (status === 'Paid') cls = 'paid';
  else if (status === 'Overdue') cls = 'overdue';
  else if (status === 'Partially Paid') cls = 'partial';
  return <span className={`ll-badge ${cls}`}>{status}</span>;
};

const fmt = (n) =>
  'ETB ' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─── Main Component ────────────────────────────────────────────── */
export default function FinanceLiabilities() {
  const [tab, setTab] = useState('dashboard');
  const [dash, setDash] = useState({
    totalLiabilities: 0, accountsPayable: 0, bankLoans: 0,
    taxesDue: 0, salaryOther: 0, overdueCount: 0,
  });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [addModal, setAddModal] = useState(null);
  const [payItem, setPayItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState({});
  const [payForm, setPayForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* Toast */
  const push = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  };

  /* Load data */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const res = await apiClient.get('/liabilities-v2/dashboard');
        const d = res?.data || res;
        if (d) setDash(d);
      } else if (tab === 'payments') {
        const res = await apiClient.get('/liabilities-v2/payments');
        setList(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      } else {
        const typeMap = { ap: 'ACCOUNTS_PAYABLE', loan: 'BANK_LOAN', tax: 'TAX', other: 'SALARY,OTHER' };
        const res = await apiClient.get('/liabilities-v2?type=' + typeMap[tab]);
        setList(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      }
    } catch {
      push('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleInput = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePayInput = e => setPayForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ep = { ap: '/add-ap', loan: '/add-loan', tax: '/add-tax', other: '/add-other' }[addModal];
      await apiClient.post('/liabilities-v2' + ep, form);
      push('Record created successfully.');
      setAddModal(null);
      setForm({});
      load();
    } catch (err) {
      push(err?.message || 'Failed to save record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/liabilities-v2/' + payItem.id + '/pay', payForm);
      push('Payment recorded successfully.');
      setPayItem(null);
      setPayForm({});
      load();
    } catch (err) {
      push(err?.message || 'Payment failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiClient.delete('/liabilities-v2/' + deleteItem.id);
      push('Record deleted.');
      load();
    } catch (err) {
      push(err?.message || 'Failed to delete.', 'error');
    } finally {
      setDeleteItem(null);
    }
  };

  const closeAdd = () => { setAddModal(null); setForm({}); };
  const closePay = () => { setPayItem(null); setPayForm({}); };

  /* ── Tab config ── */
  const tabs = [
    { id: 'dashboard', icon: Layers,     label: 'Dashboard' },
    { id: 'ap',        icon: Building2,  label: 'Accounts Payable' },
    { id: 'loan',      icon: Landmark,   label: 'Bank Loans' },
    { id: 'tax',       icon: FileText,   label: 'Taxes' },
    { id: 'other',     icon: Users,      label: 'Salary / Other' },
    { id: 'payments',  icon: History,    label: 'Payments History' },
  ];

  const addLabel = { ap: 'Add Supplier Bill', loan: 'Add Bank Loan', tax: 'Add Tax Liability', other: 'Add Salary / Other' };
  const modalTitle = {
    ap:    'New Supplier Bill',
    loan:  'New Bank Loan',
    tax:   'New Tax Liability',
    other: 'New Salary / Other Liability',
  };

  /* ── Table col helpers ── */
  const dateStr = (v) => (v ? v.split('T')[0] : '—');

  return (
    <div className="ll-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Header ── */}
      <header className="ll-header">
        <div className="ll-header-left">
          <h1 className="ll-title">
            <TrendingDown size={22} />
            Liabilities ERP
          </h1>
          <span className="ll-subtitle">Complete Liability Management Center</span>
        </div>
        <button
          className={`ll-btn-sync${loading ? ' spinning' : ''}`}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={14} />
          <span>{loading ? 'Syncing…' : 'Sync'}</span>
        </button>
      </header>

      {/* ── Tab Nav ── */}
      <nav className="ll-tabs">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`ll-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => { setTab(t.id); setList([]); }}
          >
            <t.icon size={14} />
            {t.label}
          </div>
        ))}
      </nav>

      {/* ── Body ── */}
      <main className="ll-body">

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <div className="ll-stat-grid">
            {/* Hero card */}
            <div className="ll-stat-card ll-stat-hero">
              <div>
                <div className="ll-card-label">Total Liabilities (All Types)</div>
                <div className="ll-card-val">{fmt(dash.totalLiabilities)}</div>
              </div>
              <CreditCard size={52} className="ll-card-icon" />
            </div>

            {/* Sub-cards */}
            {[
              { label: 'Accounts Payable', val: dash.accountsPayable, danger: false },
              { label: 'Bank Loans',       val: dash.bankLoans,       danger: false },
              { label: 'Taxes Due',        val: dash.taxesDue,        danger: false },
              { label: 'Salary / Other',   val: dash.salaryOther,     danger: false },
            ].map(c => (
              <div key={c.label} className="ll-stat-card">
                <div className="ll-card-label">{c.label}</div>
                <div className={`ll-card-val${c.danger ? ' danger' : ''}`}>{fmt(c.val)}</div>
                <div className={`ll-card-strip${c.danger ? ' danger' : ''}`} />
              </div>
            ))}

            {/* Overdue card */}
            <div className="ll-stat-card" style={{ borderColor: '#ef9a9a' }}>
              <div className="ll-card-label" style={{ color: C.red }}>Overdue Bills</div>
              <div className="ll-card-val danger">{dash.overdueCount}</div>
              <div className="ll-card-strip danger" />
            </div>
          </div>
        )}

        {/* ── List tabs: action bar + table ── */}
        {tab !== 'dashboard' && (
          <>
            {/* Action bar */}
            {tab !== 'payments' && (
              <div className="ll-action-bar">
                <button className="ll-btn" onClick={() => { setForm({}); setAddModal(tab); }}>
                  + {addLabel[tab]}
                </button>
              </div>
            )}

            {/* Table */}
            <div className="ll-table-wrap">
              <table className="ll-table">
                <thead className="ll-thead">
                  <tr>
                    {tab === 'payments' ? (
                      <>
                        <th className="ll-th">Date</th>
                        <th className="ll-th">Reference</th>
                        <th className="ll-th">Party</th>
                        <th className="ll-th">Type</th>
                        <th className="ll-th">Amount Paid</th>
                        <th className="ll-th">Method</th>
                      </>
                    ) : (
                      <>
                        <th className="ll-th">Date</th>
                        <th className="ll-th">Ref No.</th>
                        <th className="ll-th">Party / Lender</th>
                        {tab === 'loan' && <th className="ll-th">Rate / Term</th>}
                        {tab === 'tax'  && <th className="ll-th">Tax Type / Period</th>}
                        <th className="ll-th">Amount</th>
                        <th className="ll-th">Balance</th>
                        <th className="ll-th">Due Date</th>
                        <th className="ll-th">Status</th>
                        <th className="ll-th">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="ll-tbody">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan="10">
                        <div className="ll-empty">
                          <div className="ll-empty-icon">📋</div>
                          No records found.
                        </div>
                      </td>
                    </tr>
                  ) : list.map(r => (
                    <tr key={r.id}>
                      {tab === 'payments' ? (
                        <>
                          <td className="ll-td">{dateStr(r.payment_date)}</td>
                          <td className="ll-td mono">{r.reference_no || '—'}</td>
                          <td className="ll-td">{r.party_name || '—'}</td>
                          <td className="ll-td">{r.liability_type || '—'}</td>
                          <td className="ll-td amount">{fmt(r.amount)}</td>
                          <td className="ll-td">{r.payment_method || '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="ll-td">{dateStr(r.issue_date || r.created_at)}</td>
                          <td className="ll-td mono">{r.reference_no || '—'}</td>
                          <td className="ll-td">{r.party_name || '—'}</td>
                          {tab === 'loan' && (
                            <td className="ll-td">
                              {r.interest_rate ? `${r.interest_rate}` : '—'} / {r.term_months ? `${r.term_months} mo` : '—'}
                            </td>
                          )}
                          {tab === 'tax' && (
                            <td className="ll-td">{r.tax_type || '—'} / {r.tax_period || '—'}</td>
                          )}
                          <td className="ll-td amount">{fmt(r.amount)}</td>
                          <td className={`ll-td ${parseFloat(r.balance) > 0 ? 'balance-due' : 'balance-ok'}`}>
                            {fmt(r.balance)}
                          </td>
                          <td className="ll-td">{dateStr(r.due_date)}</td>
                          <td className="ll-td"><StatusBadge status={r.status} /></td>
                          <td className="ll-td">
                            <div className="ll-td-actions">
                              {r.status !== 'Paid' && (
                                <button className="ll-btn pay-btn" onClick={() => setPayItem(r)}>
                                  Pay
                                </button>
                              )}
                              <button className="ll-btn del-btn" onClick={() => setDeleteItem(r)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* ── Add Record Modal ── */}
      {addModal && (
        <div className="ll-overlay">
          <div className="ll-modal">
            <div className="ll-modal-head">
              <span className="ll-modal-title">
                <FileText size={16} />
                {modalTitle[addModal]}
              </span>
              <button className="ll-modal-close" onClick={closeAdd}><X size={16} /></button>
            </div>
            <div className="ll-modal-body">
              <form onSubmit={submitAdd}>

                {/* Accounts Payable fields */}
                {addModal === 'ap' && (
                  <>
                    <div className="ll-form-group">
                      <label className="ll-label">Supplier Name *</label>
                      <input required className="ll-input" name="supplier_name" placeholder="e.g. ABC Pharma" onChange={handleInput} />
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Invoice No. *</label>
                        <input required className="ll-input" name="invoice_number" placeholder="INV-001" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Amount (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="amount" placeholder="0.00" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Invoice Date</label>
                        <input type="date" className="ll-input" name="invoice_date" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Due Date</label>
                        <input type="date" className="ll-input" name="due_date" onChange={handleInput} />
                      </div>
                    </div>
                  </>
                )}

                {/* Bank Loan fields */}
                {addModal === 'loan' && (
                  <>
                    <div className="ll-form-group">
                      <label className="ll-label">Lender / Bank Name *</label>
                      <input required className="ll-input" name="lender_name" placeholder="e.g. CBE" onChange={handleInput} />
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Loan Reference No. *</label>
                        <input required className="ll-input" name="loan_no" placeholder="LN-001" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Principal Amount (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="principal_amount" placeholder="0.00" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Interest Rate</label>
                        <input className="ll-input" name="interest_rate" placeholder="e.g. 12% per year" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Term (Months)</label>
                        <input type="number" min="1" className="ll-input" name="term_months" placeholder="e.g. 36" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Loan Date</label>
                        <input type="date" className="ll-input" name="loan_date" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Due Date</label>
                        <input type="date" className="ll-input" name="due_date" onChange={handleInput} />
                      </div>
                    </div>
                  </>
                )}

                {/* Tax fields */}
                {addModal === 'tax' && (
                  <>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Tax Type *</label>
                        <input required className="ll-input" name="tax_type" placeholder="e.g. VAT, Income Tax" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Tax Reference No. *</label>
                        <input required className="ll-input" name="tax_ref" placeholder="TAX-001" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Tax Period</label>
                        <input className="ll-input" name="period" placeholder="e.g. July 2026" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Amount Due (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="amount_due" placeholder="0.00" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-group">
                      <label className="ll-label">Due Date</label>
                      <input type="date" className="ll-input" name="due_date" onChange={handleInput} />
                    </div>
                  </>
                )}

                {/* Salary / Other fields */}
                {addModal === 'other' && (
                  <>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Type *</label>
                        <select required className="ll-select" name="liability_type" onChange={handleInput}>
                          <option value="">-- Select --</option>
                          <option value="SALARY">Salary</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Party Name *</label>
                        <input required className="ll-input" name="party_name" placeholder="e.g. Staff / Vendor" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Reference No. *</label>
                        <input required className="ll-input" name="reference_no" placeholder="REF-001" onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Amount (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="amount" placeholder="0.00" onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-group">
                      <label className="ll-label">Due Date</label>
                      <input type="date" className="ll-input" name="due_date" onChange={handleInput} />
                    </div>
                  </>
                )}

                {/* Shared description */}
                <div className="ll-form-group">
                  <label className="ll-label">Description / Notes</label>
                  <input className="ll-input" name="description" placeholder="Optional notes…" onChange={handleInput} />
                </div>

                <div className="ll-form-footer">
                  <button type="button" className="ll-btn outline" onClick={closeAdd}>Cancel</button>
                  <button type="submit" className="ll-btn" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay Modal ── */}
      {payItem && (
        <div className="ll-overlay">
          <div className="ll-modal">
            <div className="ll-modal-head">
              <span className="ll-modal-title">
                <CreditCard size={16} />
                Record Payment
              </span>
              <button className="ll-modal-close" onClick={closePay}><X size={16} /></button>
            </div>
            <div className="ll-modal-body">
              {/* Balance info */}
              <div className="ll-balance-strip">
                <span className="lbl">Current Outstanding Balance</span>
                <span className="val">{fmt(payItem.balance)}</span>
                <span className="meta">Ref: {payItem.reference_no} · {payItem.party_name}</span>
              </div>

              <form onSubmit={submitPay}>
                <div className="ll-form-group">
                  <label className="ll-label">Amount to Pay (ETB) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={payItem.balance}
                    className="ll-input"
                    name="amount"
                    placeholder="0.00"
                    onChange={handlePayInput}
                  />
                </div>
                <div className="ll-form-grid">
                  <div className="ll-form-group">
                    <label className="ll-label">Payment Date</label>
                    <input
                      type="date"
                      className="ll-input"
                      name="payment_date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      onChange={handlePayInput}
                    />
                  </div>
                  <div className="ll-form-group">
                    <label className="ll-label">Payment Method</label>
                    <select className="ll-select" name="payment_method" onChange={handlePayInput}>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                </div>
                <div className="ll-form-group">
                  <label className="ll-label">Notes</label>
                  <input className="ll-input" name="notes" placeholder="Optional notes…" onChange={handlePayInput} />
                </div>

                <div className="ll-form-footer">
                  <button type="button" className="ll-btn outline" onClick={closePay}>Cancel</button>
                  <button type="submit" className="ll-btn" style={{ background: C.emerald, borderColor: C.emerald }} disabled={submitting}>
                    {submitting ? 'Processing…' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteItem && (
        <div className="ll-overlay">
          <div className="ll-modal">
            <div className="ll-modal-head" style={{ background: C.red }}>
              <span className="ll-modal-title">
                <AlertCircle size={16} />
                Confirm Delete
              </span>
              <button className="ll-modal-close" onClick={() => setDeleteItem(null)}><X size={16} /></button>
            </div>
            <div className="ll-modal-body">
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: C.darkGray, marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Are you sure you want to delete this liability record for <strong>{deleteItem.party_name}</strong>?
                <br /><br />
                This action cannot be undone.
              </div>
              <div className="ll-form-footer">
                <button type="button" className="ll-btn outline" onClick={() => setDeleteItem(null)}>Cancel</button>
                <button type="button" className="ll-btn del-btn" onClick={confirmDelete} style={{ fontSize: '0.82rem', padding: '0.65rem 1.4rem' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      <div className="ll-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`ll-toast${t.type === 'error' ? ' error' : ''}`}>
            {t.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle size={17} />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
