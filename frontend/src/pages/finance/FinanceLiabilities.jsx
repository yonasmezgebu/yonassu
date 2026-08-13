import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Building2, Landmark, FileText, Users, History,
  X, CheckCircle, AlertCircle, RefreshCw, Trash2, CreditCard, TrendingDown, Edit2
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Color Palette ────────────────────────────────────────────── */
const C = {
  forest:     '#2563EB',
  darkGreen:  '#1D4ED8',
  emerald:    '#16A34A',
  leafGreen:  '#2563EB',
  sage:       '#BFDBFE',
  olive:      '#6B7280',
  mint:       '#EFF6FF',
  lime:       '#16A34A',
  earthBrown: '#E5E7EB',
  skyBlue:    '#E0F2FE',
  white:      '#FFFFFF',
  lightGray:  '#F5F6FA',
  darkGray:   '#111827',
  orange:     '#D97706',
  red:        '#DC2626',
  border:     '#E5E7EB',
};

/* ─── Global Styles ────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  /* ── 1/4 Design tokens ── */
  .ll-wrap {
    --color-primary:#2563EB;
    --color-primary-hover:#1D4ED8;
    --color-bg-page:#F5F6FA;
    --color-bg-card:#FFFFFF;
    --color-border:#E5E7EB;
    --color-text-primary:#111827;
    --color-text-secondary:#6B7280;
    --color-text-muted:#9CA3AF;
    --color-success:#16A34A; --color-success-bg:#DCFCE7;
    --color-danger:#DC2626;  --color-danger-bg:#FEE2E2;
    --color-warning:#D97706; --color-warning-bg:#FEF3C7;
    --color-info:#0284C7;    --color-info-bg:#E0F2FE;
    --color-gold:#F59E0B;    --color-gold-bg:#FEF3C7;
    --color-row-hover:#F9FAFB;

    /* 2/25 Typography: 16px body, 1.5 leading, 1.3 headings */
    font-family: 'Inter', 'Segoe UI', Roboto, -apple-system, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--color-text-primary);

    /* 17/18/24 Safe-edge + flush wiring: mirror dash-content padding */
    background: var(--color-bg-page);
    margin: -24px;
    padding: 24px;
    min-height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (max-width: 1024px) { .ll-wrap { margin: -16px; padding: 16px; } }
  @media (max-width: 768px)  { .ll-wrap { margin: -12px; padding: 12px; } }
  @media (min-width: 1536px) { .ll-wrap { margin-left: auto; margin-right: auto; max-width: 1560px; } }

  /* ── Header ── */
  .ll-header {
    width: 100%;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    gap: 16px;
    flex-wrap: wrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .ll-header-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .ll-title {
    font-size: 28px;               /* 25: 28px page title */
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.01em;
    line-height: 1.3;
    margin: 0;
  }
  .ll-title svg { color: var(--color-primary); flex-shrink: 0; }
  .ll-subtitle {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  /* ── Sync Button (3/7/22) ── */
  .ll-btn-sync {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    height: 36px;
    padding: 0 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    font-size: 14px;
    border-radius: 8px;
    transition: all 150ms ease-in-out;
    white-space: nowrap;
    font-family: inherit;
  }
  .ll-btn-sync.spinning svg { animation: ll-spin 0.9s linear infinite; }
  @keyframes ll-spin { to { transform: rotate(360deg); } }

  /* ── Tab Navigation (14: scroll-snap on mobile) ── */
  .ll-tabs {
    width: 100%;
    display: flex;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    overflow-x: auto;
    flex-shrink: 0;
    scrollbar-width: none;
    gap: 4px;
    padding: 0 8px;
    margin: 0;
    scroll-snap-type: x proximity;
  }
  .ll-tabs::-webkit-scrollbar { display: none; }
  .ll-tab {
    padding: 12px 16px;
    font-weight: 500;
    font-size: 13px;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 150ms ease-in-out, background 150ms ease-in-out, border-color 150ms ease-in-out;
    flex-shrink: 0;
    min-height: 48px;
    border-radius: 8px 8px 0 0;
    scroll-snap-align: start;
  }
  .ll-tab:hover { color: var(--color-primary); background: var(--color-row-hover); }
  .ll-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); background: var(--color-info-bg); }

  /* ── Content Area ── */
  .ll-body {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Dashboard Cards (6/14) ── */
  .ll-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    width: 100%;
  }
  .ll-stat-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out, border-color 150ms ease-in-out;
    cursor: default;
    min-width: 0;
  }
  .ll-stat-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .ll-card-label { font-size: 12px; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; line-height: 1.4; }
  .ll-card-val { font-size: 26px; font-weight: 700; color: var(--color-text-primary); margin-top: 4px; font-variant-numeric: tabular-nums; line-height: 1.3; }
  .ll-card-val.danger { color: var(--color-danger); }
  .ll-card-strip { height: 3px; background: var(--color-primary); margin-top: 8px; border-radius: 99px; }
  .ll-card-strip.danger { background: var(--color-danger); }

  /* ── Hero (single primary accent) ── */
  .ll-stat-hero {
    grid-column: 1 / -1;
    background: var(--color-primary) !important;
    border: 1px solid var(--color-primary) !important;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-radius: 10px;
    color: #FFFFFF !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    transition: background 150ms ease-in-out, box-shadow 150ms ease-in-out, transform 150ms ease-in-out;
  }
  .ll-stat-card.ll-stat-hero:hover { background: var(--color-primary-hover) !important; box-shadow: 0 4px 12px rgba(37,99,235,0.25); transform: translateY(-1px); }
  .ll-stat-card.ll-stat-hero .ll-card-label { color: rgba(255,255,255,0.85) !important; }
  .ll-stat-card.ll-stat-hero .ll-card-val { color: #FFFFFF !important; font-size: 30px; font-weight: 700; margin-top: 4px; }
  .ll-stat-card.ll-stat-hero .ll-card-icon { color: rgba(255,255,255,0.3); }

  /* ── Action bar (14: wrap) ── */
  .ll-action-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* ── Buttons: every button gets a gold hover (3/7/19/20/21) ── */
  .ll-wrap button {
    font-family: inherit;
    border-radius: 8px;
    transition: all 150ms ease-in-out !important;
  }
  .ll-wrap button:not(:disabled):hover {
    background: var(--color-gold) !important;
    border-color: var(--color-gold) !important;
    color: #111827 !important;
    box-shadow: 0 4px 14px rgba(245,158,11,0.35) !important;
    transform: translateY(-1px) !important;
  }
  .ll-wrap button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  .ll-wrap button:disabled { opacity: 0.5; cursor: not-allowed; }

  .ll-btn {
    background: var(--color-primary);
    color: #FFFFFF;
    border: 1px solid var(--color-primary);
    height: 36px;
    padding: 0 16px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    white-space: nowrap;
  }
  .ll-btn.outline {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    border-color: var(--color-border);
    box-shadow: none;
  }
  .ll-btn.pay-btn {
    background: var(--color-success);
    border-color: var(--color-success);
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
  }
  .ll-btn.del-btn {
    background: var(--color-danger);
    border-color: var(--color-danger);
    height: 32px;
    padding: 0 12px;
    font-size: 13px;
  }

  /* ── Table (9/25) ── */
  .ll-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    border-radius: 10px;
  }
  .ll-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;            /* 14: horizontal scroll, no page overflow */
    font-size: 14px;             /* 25: 14px tables */
  }
  .ll-thead { background: #F9FAFB; }
  .ll-th {
    padding: 12px 16px;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .ll-tbody tr { transition: background 150ms ease-in-out; border-bottom: 1px solid var(--color-border); }
  .ll-tbody tr:hover { background: var(--color-row-hover); }
  .ll-tbody tr:last-child { border-bottom: none; }
  .ll-td {
    padding: 12px 16px;          /* ~48px rows */
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    vertical-align: middle;
  }
  .ll-td.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-weight: 600; font-size: 13px; color: var(--color-primary); font-variant-numeric: tabular-nums; }
  .ll-td.amount { font-weight: 700; color: var(--color-text-primary); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ll-td.balance-due { font-weight: 700; color: var(--color-danger); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ll-td.balance-ok { font-weight: 700; color: var(--color-success); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ll-td-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .ll-empty {
    text-align: center;
    padding: 48px 16px;
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: 400;
  }
  .ll-empty-icon { font-size: 2rem; margin-bottom: 8px; opacity: 0.6; }

  /* ── Status Badge (8) ── */
  .ll-badge {
    display: inline-block;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 99px;
    white-space: nowrap;
    line-height: 1.6;
  }
  .ll-badge.paid    { background: var(--color-success-bg); color: #15803D; }
  .ll-badge.partial { background: var(--color-warning-bg); color: #92400E; }
  .ll-badge.overdue { background: var(--color-danger-bg); color: #B91C1C; }
  .ll-badge.pending { background: var(--color-info-bg); color: #0369A1; }

  /* ── Modal (13) ── */
  .ll-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
    overflow-y: auto;
  }
  .ll-modal {
    background: var(--color-bg-card);
    width: 100%;
    max-width: 580px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.25);
    margin: auto;
    overflow: hidden;
  }
  .ll-modal-head {
    background: var(--color-primary);
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ll-modal-title {
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ll-modal-close {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    color: #FFFFFF;
    cursor: pointer;
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 150ms ease-in-out;
  }
  .ll-modal-body { padding: 20px; }

  /* ── Balance info strip ── */
  .ll-balance-strip {
    background: var(--color-info-bg);
    border: 1px solid #BFDBFE;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ll-balance-strip .lbl { font-size: 12px; font-weight: 600; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.03em; }
  .ll-balance-strip .val { font-size: 24px; font-weight: 700; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
  .ll-balance-strip .meta { font-size: 13px; color: var(--color-text-secondary); font-weight: 400; }

  /* ── Form Fields (12) ── */
  .ll-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ll-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .ll-form-group:last-child { margin-bottom: 0; }
  .ll-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .ll-input, .ll-select {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-card);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    transition: border-color 150ms ease-in-out, box-shadow 150ms ease-in-out;
    outline: none;
    appearance: auto;
  }
  .ll-input:focus, .ll-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .ll-input::placeholder { color: var(--color-text-muted); }
  .ll-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
    flex-wrap: wrap;
  }

  /* ── Toast (13/22) ── */
  .ll-toasts {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 9000;
    pointer-events: none;
  }
  .ll-toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--color-success-bg);
    color: #15803D;
    border-left: 4px solid var(--color-success);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    animation: ll-slidein 0.28s cubic-bezier(0.16,1,0.3,1);
    min-width: 260px;
    max-width: 380px;
    pointer-events: all;
  }
  .ll-toast.error { background: var(--color-danger-bg); color: #B91C1C; border-left-color: var(--color-danger); }
  @keyframes ll-slidein { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* ── Responsive (14/16/18) ── */
  @media (max-width: 1280px) {
    .ll-title { font-size: 26px; }
  }
  @media (max-width: 768px) {
    .ll-header { padding: 12px 16px; }
    .ll-title { font-size: 24px; }
    .ll-tab { padding: 10px 12px; font-size: 12px; }
    .ll-form-grid { grid-template-columns: 1fr; }
    .ll-modal { max-width: 100%; margin: 0; }
    .ll-toasts { right: 12px; left: 12px; }
    .ll-toast { min-width: 0; max-width: 100%; }
    .ll-btn, .ll-btn-sync { height: 44px; }          /* 14: tap target ≥ 44px */
    .ll-btn.pay-btn, .ll-btn.del-btn { height: 40px; }
  }
  @media (max-width: 480px) {
    .ll-title { font-size: 22px; }
    .ll-action-bar { justify-content: stretch; }
    .ll-action-bar .ll-btn { width: 100%; justify-content: center; }
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
  const [editItem, setEditItem] = useState(null);
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
      const ep = { ap: '/accounts-payable', loan: '/loans', tax: '/taxes', other: '/salary-other' }[addModal];
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

  
  const submitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put('/liabilities-v2/' + editItem.id, form);
      push('Record updated successfully.');
      setEditItem(null);
      setForm({});
      load();
    } catch (err) {
      push(err?.message || 'Failed to update record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const closeAdd = () => { setAddModal(null); setForm({}); };
  const closeEdit = () => { setEditItem(null); setForm({}); };

  const openEdit = (r) => {
    const f = { ...r };
    if (f.due_date) f.due_date = f.due_date.split('T')[0];
    if (f.issue_date) f.issue_date = f.issue_date.split('T')[0];
    if (f.created_at) f.created_at = f.created_at.split('T')[0];
    
    if (tab === 'ap') {
      f.supplier_name = r.party_name;
      f.invoice_number = r.reference_no;
      f.invoice_date = f.issue_date || f.created_at;
    } else if (tab === 'loan') {
      f.lender_name = r.party_name;
      f.loan_no = r.reference_no;
      f.principal_amount = r.amount;
      f.loan_date = f.issue_date || f.created_at;
    } else if (tab === 'tax') {
      f.tax_type = r.party_name || r.tax_type;
      f.tax_ref = r.reference_no;
      f.period = r.tax_period;
      f.amount_due = r.amount;
    } else if (tab === 'other') {
      f.liability_type_sub = r.liability_type;
    }
    setForm(f);
    setEditItem(r);
  };
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
                              <button className="ll-btn" style={{ width: '32px', height: '32px', padding: '0', justifyContent: 'center', background: '#2563EB', borderColor: '#2563EB', color: '#fff' }} onClick={() => openEdit(r)}>
                                <Edit2 size={12} />
                              </button>
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
                        <select required className="ll-select" name="liability_type_sub" value={form.liability_type_sub || ''} onChange={handleInput}>
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

      

      {/* ── Edit Modal ── */}
      {editItem && (
        <div className="ll-overlay">
          <div className="ll-modal">
            <div className="ll-modal-head">
              <span className="ll-modal-title">
                <FileText size={16} />
                {('Edit ' + modalTitle[tab])}
              </span>
              <button className="ll-modal-close" onClick={closeEdit}><X size={16} /></button>
            </div>
            <div className="ll-modal-body">
              <form onSubmit={submitEdit}>

                {/* Accounts Payable fields */}
                {tab === 'ap' && (
                  <>
                    <div className="ll-form-group">
                      <label className="ll-label">Supplier Name *</label>
                      <input required className="ll-input" name="supplier_name" value={form.supplier_name || ''} onChange={handleInput} />
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Invoice No. *</label>
                        <input required className="ll-input" name="invoice_number" value={form.invoice_number || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Amount (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="amount" value={form.amount || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Invoice Date</label>
                        <input type="date" className="ll-input" name="invoice_date" value={form.invoice_date || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Due Date</label>
                        <input type="date" className="ll-input" name="due_date" value={form.due_date || ''} onChange={handleInput} />
                      </div>
                    </div>
                  </>
                )}

                {/* Bank Loan fields */}
                {tab === 'loan' && (
                  <>
                    <div className="ll-form-group">
                      <label className="ll-label">Lender / Bank Name *</label>
                      <input required className="ll-input" name="lender_name" value={form.lender_name || ''} onChange={handleInput} />
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Loan Reference No. *</label>
                        <input required className="ll-input" name="loan_no" value={form.loan_no || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Principal Amount (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="principal_amount" value={form.principal_amount || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Interest Rate</label>
                        <input className="ll-input" name="interest_rate" value={form.interest_rate || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Term (Months)</label>
                        <input type="number" min="1" className="ll-input" name="term_months" value={form.term_months || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Loan Date</label>
                        <input type="date" className="ll-input" name="loan_date" value={form.loan_date || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Due Date</label>
                        <input type="date" className="ll-input" name="due_date" value={form.due_date || ''} onChange={handleInput} />
                      </div>
                    </div>
                  </>
                )}

                {/* Tax fields */}
                {tab === 'tax' && (
                  <>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Tax Type *</label>
                        <input required className="ll-input" name="tax_type" value={form.tax_type || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Tax Reference No. *</label>
                        <input required className="ll-input" name="tax_ref" value={form.tax_ref || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Tax Period</label>
                        <input className="ll-input" name="period" value={form.period || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Amount Due (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="amount_due" value={form.amount_due || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-group">
                      <label className="ll-label">Due Date</label>
                      <input type="date" className="ll-input" name="due_date" value={form.due_date || ''} onChange={handleInput} />
                    </div>
                  </>
                )}

                {/* Salary / Other fields */}
                {tab === 'other' && (
                  <>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Type *</label>
                        <select required className="ll-select" name="liability_type_sub" value={form.liability_type_sub || ''} onChange={handleInput}>
                          <option value="">-- Select --</option>
                          <option value="SALARY">Salary</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Party Name *</label>
                        <input required className="ll-input" name="party_name" value={form.party_name || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-grid">
                      <div className="ll-form-group">
                        <label className="ll-label">Reference No. *</label>
                        <input required className="ll-input" name="reference_no" value={form.reference_no || ''} onChange={handleInput} />
                      </div>
                      <div className="ll-form-group">
                        <label className="ll-label">Amount (ETB) *</label>
                        <input required type="number" step="0.01" min="0" className="ll-input" name="amount" value={form.amount || ''} onChange={handleInput} />
                      </div>
                    </div>
                    <div className="ll-form-group">
                      <label className="ll-label">Due Date</label>
                      <input type="date" className="ll-input" name="due_date" value={form.due_date || ''} onChange={handleInput} />
                    </div>
                  </>
                )}

                {/* Shared description */}
                <div className="ll-form-group">
                  <label className="ll-label">Description / Notes</label>
                  <input className="ll-input" name="description" value={form.description || ''} onChange={handleInput} />
                </div>

                <div className="ll-form-footer">
                  <button type="button" className="ll-btn outline" onClick={closeEdit}>Cancel</button>
                  <button type="submit" className="ll-btn" disabled={submitting}>
                    {submitting ? 'Updating…' : 'Update Record'}
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
