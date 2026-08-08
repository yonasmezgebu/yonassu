import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, CheckCircle, AlertCircle, X, RefreshCw,
  FileText, Users, TrendingUp, DollarSign, Clock, CreditCard, Pencil, Trash2
} from 'lucide-react';
import apiClient from '../../services/apiClient';

// ─── GREEN UNIVERSITY PALETTE ───────────────────────────────────────
const G = {
  forest:   '#228B22', dark:      '#1B5E20', emerald:  '#2E8B57',
  leaf:     '#4CAF50', sage:      '#A5D6A7', olive:    '#6B8E23',
  mint:     '#F1F8F1', lime:      '#8BC34A', brown:    '#8D6E63',
  sky:      '#87CEEB', white:     '#FFFFFF', lightGray:'#F5F5F5',
  darkGray: '#424242', warning:   '#FF9800', error:    '#F44336',
};

// ─── GLOBAL CSS ──────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; border-radius: 0 !important; }
  .ar-wrap { font-family: 'Inter', sans-serif; background: ${G.lightGray}; min-height: 100vh; width: 100%; color: ${G.darkGray}; }
  .ar-spin { animation: ar-spin 1s linear infinite; }
  @keyframes ar-spin { to { transform: rotate(360deg); } }

  /* Header */
  .ar-header { background: ${G.dark}; padding: 0.9rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${G.forest}; width: 100%; }
  .ar-header-title { font-size: 1.35rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -0.3px; display: flex; align-items: center; gap: 0.6rem; }
  .ar-header-sub { font-size: 0.72rem; color: ${G.sage}; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 2px; padding-left: 2px; }

  /* Sync btn */
  .ar-btn-sync { background: transparent; border: 2px solid rgba(255,255,255,0.38); color: #fff; padding: 0.48rem 0.9rem; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.6px; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: background 0.18s, transform 0.15s; white-space: nowrap; }
  .ar-btn-sync:hover { background: rgba(255,255,255,0.12); border-color: ${G.sage}; transform: translateY(-1px); }
  .ar-btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }

  /* KPI grid */
  .ar-kpi { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; padding: 1.5rem; width: 100%; }
  @media (max-width: 1100px) { .ar-kpi { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 680px)  { .ar-kpi { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 420px)  { .ar-kpi { grid-template-columns: 1fr; } }

  /* KPI card */
  .ar-kpi-card { background: #fff; border: 2px solid ${G.sage}; padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s; }
  .ar-kpi-card:hover { border-color: ${G.leaf}; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(34,139,34,0.1); }
  .ar-kpi-icon { display: inline-flex; padding: 8px; border: 2px solid ${G.dark}; }
  .ar-kpi-val { font-size: 1.35rem; font-weight: 900; color: ${G.dark}; letter-spacing: -0.5px; margin-top: 4px; line-height: 1.1; }
  .ar-kpi-lbl { font-size: 0.7rem; font-weight: 700; color: #757575; text-transform: uppercase; letter-spacing: 0.6px; }
  .ar-kpi-strip { height: 3px; margin-top: 6px; }

  /* Toolbar */
  .ar-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: 1rem 1.5rem; background: ${G.dark}; border-bottom: 2px solid ${G.forest}; }
  .ar-toolbar-title { font-size: 0.85rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
  .ar-toolbar-right { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .ar-search-wrap { position: relative; display: flex; align-items: center; }
  .ar-search-wrap svg { position: absolute; left: 10px; color: #757575; pointer-events: none; }
  .ar-search { padding: 0.5rem 0.8rem 0.5rem 2.2rem; border: 2px solid #bdbdbd; background: #fff; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.82rem; color: ${G.darkGray}; outline: none; width: 220px; transition: border-color 0.18s; }
  .ar-search:focus { border-color: ${G.forest}; }

  /* Primary button */
  .ar-btn { background: ${G.forest}; color: #fff; border: 2px solid ${G.forest}; padding: 0.55rem 1.1rem; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; transition: background 0.18s, transform 0.15s, box-shadow 0.18s; white-space: nowrap; }
  .ar-btn:hover { background: ${G.dark}; border-color: ${G.dark}; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(27,94,32,0.22); }
  .ar-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .ar-btn.outline { background: transparent; color: ${G.darkGray}; border-color: #bdbdbd; }
  .ar-btn.outline:hover { background: ${G.lightGray}; border-color: #9e9e9e; transform: none; box-shadow: none; }
  .ar-btn.sm { padding: 0.28rem 0.65rem; font-size: 0.72rem; }
  .ar-btn.pay  { background: ${G.emerald}; border-color: ${G.emerald}; }
  .ar-btn.pay:hover  { background: ${G.forest}; border-color: ${G.forest}; }
  .ar-btn.edit { background: ${G.olive}; border-color: ${G.olive}; }
  .ar-btn.edit:hover { background: #556b2f; border-color: #556b2f; }
  .ar-btn.del  { background: ${G.error}; border-color: ${G.error}; }
  .ar-btn.del:hover  { background: #c62828; border-color: #c62828; }

  /* Filter pills */
  .ar-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 1rem 1.5rem 0; }
  .ar-pill { padding: 0.4rem 0.9rem; border: 2px solid #bdbdbd; background: #fff; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.72rem; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
  .ar-pill:hover { background: ${G.mint}; border-color: ${G.forest}; color: ${G.forest}; }
  .ar-pill.active { background: ${G.dark}; border-color: ${G.dark}; color: #fff; }

  /* Table wrapper */
  .ar-table-wrap { padding: 1rem 1.5rem 1.5rem; }
  .ar-table-box { border: 2px solid ${G.sage}; background: #fff; overflow-x: auto; }
  .ar-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .ar-thead { background: ${G.forest}; }
  .ar-th { padding: 0.85rem 1rem; color: #fff; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; text-align: left; border-right: 1px solid rgba(255,255,255,0.18); white-space: nowrap; }
  .ar-th:last-child { border-right: none; }
  .ar-tbody tr { border-bottom: 1px solid ${G.sage}; transition: background 0.14s; }
  .ar-tbody tr:last-child { border-bottom: none; }
  .ar-tbody tr:hover { background: ${G.mint} !important; }
  .ar-td { padding: 0.8rem 1rem; font-size: 0.84rem; font-weight: 500; color: ${G.darkGray}; vertical-align: middle; border-right: 1px solid #e0e0e0; }
  .ar-td:last-child { border-right: none; }
  .ar-td.bold { font-weight: 800; color: ${G.dark}; }
  .ar-td.money { font-weight: 800; color: ${G.dark}; }
  .ar-td.received { font-weight: 700; color: ${G.emerald}; }
  .ar-td.due { font-weight: 800; }
  .ar-td.actions { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
  .ar-empty { padding: 3.5rem 1rem; text-align: center; }
  .ar-empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .ar-empty-msg { font-size: 0.9rem; font-weight: 600; color: #9e9e9e; }

  /* Status badge */
  .ar-badge { display: inline-block; padding: 3px 8px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .ar-badge.pending  { background: #E3F2FD; color: #1565C0; border: 1.5px solid #90CAF9; }
  .ar-badge.partial  { background: #FFF8E1; color: ${G.warning}; border: 1.5px solid #FFD54F; }
  .ar-badge.received { background: #E8F5E9; color: ${G.forest}; border: 1.5px solid ${G.sage}; }
  .ar-badge.overdue  { background: #FFEBEE; color: ${G.error};  border: 1.5px solid #EF9A9A; }

  /* Modal */
  .ar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.58); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: flex-start; z-index: 1000; padding: 1rem; overflow-y: auto; }
  .ar-modal { background: #fff; width: 100%; max-width: 540px; border: 2.5px solid ${G.forest}; margin: auto; overflow: hidden; }
  .ar-modal-head { background: ${G.dark}; padding: 0.95rem 1.4rem; display: flex; justify-content: space-between; align-items: center; }
  .ar-modal-title { font-size: 0.92rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 0.5rem; }
  .ar-modal-close { background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.3); color: #fff; cursor: pointer; padding: 0.25rem 0.5rem; display: flex; align-items: center; transition: background 0.15s; }
  .ar-modal-close:hover { background: rgba(255,255,255,0.25); }
  .ar-modal-body { padding: 1.4rem; }

  /* Info strip in pay modal */
  .ar-info-strip { background: ${G.mint}; border: 2px solid ${G.sage}; padding: 0.9rem 1.1rem; margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 4px; }
  .ar-info-strip .lbl { font-size: 0.68rem; font-weight: 700; color: #757575; text-transform: uppercase; letter-spacing: 0.6px; }
  .ar-info-strip .val { font-size: 1.3rem; font-weight: 900; color: ${G.dark}; }
  .ar-info-strip .meta { font-size: 0.78rem; color: ${G.olive}; font-weight: 600; }

  /* Form */
  .ar-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 480px) { .ar-form-grid { grid-template-columns: 1fr; } }
  .ar-form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 1rem; }
  .ar-form-group:last-child { margin-bottom: 0; }
  .ar-label { font-size: 0.7rem; font-weight: 700; color: ${G.darkGray}; text-transform: uppercase; letter-spacing: 0.5px; }
  .ar-input, .ar-select { width: 100%; padding: 0.62rem 0.85rem; border: 2px solid #bdbdbd; background: #fff; font-family: 'Inter', sans-serif; font-size: 0.87rem; font-weight: 500; color: ${G.darkGray}; outline: none; transition: border-color 0.18s, box-shadow 0.18s; appearance: auto; }
  .ar-input:focus, .ar-select:focus { border-color: ${G.forest}; border-width: 2.5px; box-shadow: 0 0 0 3px rgba(34,139,34,0.1); }
  .ar-input::placeholder { color: #bdbdbd; }
  .ar-form-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.4rem; padding-top: 1rem; border-top: 1.5px solid #e0e0e0; flex-wrap: wrap; }

  /* Toast */
  .ar-toasts { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; z-index: 9000; pointer-events: none; }
  .ar-toast { display: flex; align-items: center; gap: 0.65rem; padding: 0.8rem 1.1rem; background: ${G.dark}; color: #fff; border-left: 4px solid ${G.leaf}; font-size: 0.84rem; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.18); animation: ar-slidein 0.28s cubic-bezier(0.16,1,0.3,1); min-width: 240px; max-width: 360px; pointer-events: all; }
  .ar-toast.error { background: #b71c1c; border-left-color: ${G.error}; }
  @keyframes ar-slidein { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* Responsive */
  @media (max-width: 768px) {
    .ar-header { padding: 0.75rem 1rem; }
    .ar-kpi, .ar-filters, .ar-table-wrap { padding-left: 1rem; padding-right: 1rem; }
    .ar-toolbar { padding: 0.8rem 1rem; }
    .ar-search { width: 160px; }
  }
`;

// ─── Badge Component ─────────────────────────────────────────────────
const Badge = ({ status }) => {
  const cls = status === 'Received' ? 'received' : status === 'Partially Received' ? 'partial' : status === 'Overdue' ? 'overdue' : 'pending';
  return <span className={`ar-badge ${cls}`}>{status}</span>;
};

const fmt = n => `ETB ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function FinanceAccountsReceivable() {
  const [receivables, setReceivables] = useState([]);
  const [dashboard, setDashboard] = useState({ totalReceivables: 0, invoicedThisMonth: 0, receivedThisMonth: 0, overdueReceivables: 0, customersWithBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  // Modals: null = closed
  const [addModal, setAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);   // item to edit
  const [payItem, setPayItem] = useState(null);     // item to pay
  const [deleteItem, setDeleteItem] = useState(null); // item to delete

  // Toasts
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const push = useCallback((msg, type = 'success') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  // Empty forms
  const emptyInv = { customer_name: '', invoice_number: '', invoice_date: '', due_date: '', amount: '', description: '' };
  const emptyPay = { payment_date: new Date().toISOString().split('T')[0], amount: '', payment_method: 'Cash', notes: '' };
  const [invForm, setInvForm] = useState(emptyInv);
  const [payForm, setPayForm] = useState(emptyPay);

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, listRes] = await Promise.all([
        apiClient.get('/erp-receivables/dashboard'),
        apiClient.get('/erp-receivables'),
      ]);
      const d = dashRes?.data || dashRes || {};
      const l = listRes?.data || listRes || [];
      setDashboard(d.data || d);
      setReceivables(Array.isArray(l.data) ? l.data : Array.isArray(l) ? l : []);
    } catch {
      push('Failed to load receivables data', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Add Invoice ──
  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/erp-receivables', invForm);
      push('Invoice created successfully.');
      setAddModal(false);
      setInvForm(emptyInv);
      loadData();
    } catch (err) {
      push(err?.message || 'Failed to create invoice.', 'error');
    } finally { setSubmitting(false); }
  };

  // ── Update Invoice ──
  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put('/erp-receivables/' + editItem.id, invForm);
      push('Invoice updated successfully.');
      setEditItem(null);
      setInvForm(emptyInv);
      loadData();
    } catch (err) {
      push(err?.message || 'Failed to update invoice.', 'error');
    } finally { setSubmitting(false); }
  };

  // Open edit: pre-fill form
  const openEdit = (item) => {
    setInvForm({
      customer_name:  item.customer_name  || '',
      invoice_number: item.invoice_number || '',
      invoice_date:   item.invoice_date   ? item.invoice_date.split('T')[0] : '',
      due_date:       item.due_date       ? item.due_date.split('T')[0]     : '',
      amount:         item.amount         || '',
      description:    item.description    || '',
    });
    setEditItem(item);
  };

  // ── Delete Invoice ──
  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await apiClient.delete('/erp-receivables/' + deleteItem.id);
      push('Invoice deleted.');
      loadData();
    } catch (err) {
      push(err?.message || 'Failed to delete invoice.', 'error');
    } finally {
      setDeleteItem(null);
    }
  };

  // ── Record Payment ──
  const handlePay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/erp-receivables/' + payItem.id + '/pay', payForm);
      push('Payment recorded for ' + payItem.invoice_number);
      setPayItem(null);
      setPayForm(emptyPay);
      loadData();
    } catch (err) {
      push(err?.message || 'Failed to record payment.', 'error');
    } finally { setSubmitting(false); }
  };

  // ── Filter ──
  const STATUS_OPTIONS = ['All', 'Pending', 'Partially Received', 'Received', 'Overdue'];
  const filtered = receivables.filter(r => {
    const s = searchTerm.toLowerCase();
    const matchSearch = (r.customer_name || '').toLowerCase().includes(s) || (r.invoice_number || '').toLowerCase().includes(s);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const dateStr = v => v ? v.split('T')[0] : '—';

  // Shared invoice form JSX
  const InvFormFields = () => (
    <>
      <div className="ar-form-group">
        <label className="ar-label">Customer Name *</label>
        <input required className="ar-input" placeholder="e.g. Kebede Store" value={invForm.customer_name} onChange={e => setInvForm(f => ({ ...f, customer_name: e.target.value }))} />
      </div>
      <div className="ar-form-grid">
        <div className="ar-form-group">
          <label className="ar-label">Invoice No. *</label>
          <input required className="ar-input" placeholder="INV-101" value={invForm.invoice_number} onChange={e => setInvForm(f => ({ ...f, invoice_number: e.target.value }))} />
        </div>
        <div className="ar-form-group">
          <label className="ar-label">Amount (ETB) *</label>
          <input required type="number" min="0" step="0.01" className="ar-input" placeholder="5000.00" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))} />
        </div>
      </div>
      <div className="ar-form-grid">
        <div className="ar-form-group">
          <label className="ar-label">Invoice Date *</label>
          <input required type="date" className="ar-input" value={invForm.invoice_date} onChange={e => setInvForm(f => ({ ...f, invoice_date: e.target.value }))} />
        </div>
        <div className="ar-form-group">
          <label className="ar-label">Due Date *</label>
          <input required type="date" className="ar-input" value={invForm.due_date} onChange={e => setInvForm(f => ({ ...f, due_date: e.target.value }))} />
        </div>
      </div>
      <div className="ar-form-group">
        <label className="ar-label">Description</label>
        <input className="ar-input" placeholder="e.g. Medicine sold on credit" value={invForm.description} onChange={e => setInvForm(f => ({ ...f, description: e.target.value }))} />
      </div>
    </>
  );

  return (
    <div className="ar-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Header ── */}
      <header className="ar-header">
        <div>
          <div className="ar-header-title">
            <FileText size={20} />
            Accounts Receivable
          </div>
          <div className="ar-header-sub">Finance Module · Customer Invoices & Payment Tracking</div>
        </div>
        <button className="ar-btn-sync" onClick={loadData} disabled={loading}>
          <SegmentedSpinner size={14} />
          {loading ? 'Loading…' : 'Sync'}
        </button>
      </header>

      {/* ── KPI Cards ── */}
      <div className="ar-kpi">
        {[
          { label: 'Total Receivables',    val: fmt(dashboard.totalReceivables),   icon: DollarSign, color: G.dark    },
          { label: 'Invoiced This Month',  val: fmt(dashboard.invoicedThisMonth),  icon: FileText,   color: G.forest  },
          { label: 'Received This Month',  val: fmt(dashboard.receivedThisMonth),  icon: TrendingUp, color: G.emerald },
          { label: 'Overdue Receivables',  val: fmt(dashboard.overdueReceivables), icon: Clock,      color: G.error   },
          { label: 'Customers w/ Balance', val: dashboard.customersWithBalance || 0, icon: Users,    color: G.olive   },
        ].map(c => (
          <div key={c.label} className="ar-kpi-card">
            <div className="ar-kpi-icon" style={{ background: c.color, borderColor: G.dark }}>
              <c.icon size={18} color="#fff" />
            </div>
            <div className="ar-kpi-val">{c.val}</div>
            <div className="ar-kpi-lbl">{c.label}</div>
            <div className="ar-kpi-strip" style={{ background: c.color }} />
          </div>
        ))}
      </div>

      {/* ── Filter Pills ── */}
      <div className="ar-filters">
        {STATUS_OPTIONS.map(s => (
          <button key={s} className={`ar-pill${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="ar-table-wrap">
        {/* Toolbar */}
        <div className="ar-toolbar">
          <span className="ar-toolbar-title">Customer Invoice Ledger</span>
          <div className="ar-toolbar-right">
            <div className="ar-search-wrap">
              <Search size={14} />
              <input className="ar-search" type="text" placeholder="Search customer / INV…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="ar-btn" onClick={() => { setInvForm(emptyInv); setAddModal(true); }}>
              <Plus size={14} /> Add Invoice
            </button>
          </div>
        </div>

        <div className="ar-table-box">
          {loading && receivables.length === 0 ? (
            <div className="ar-empty">
              <SegmentedSpinner size={36} />
              <div className="ar-empty-msg">Loading receivables…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ar-empty">
              <div className="ar-empty-icon">📋</div>
              <div className="ar-empty-msg">No invoices found. Add one to get started.</div>
            </div>
          ) : (
            <table className="ar-table">
              <thead className="ar-thead">
                <tr>
                  {['Invoice No', 'Customer', 'Amount', 'Received', 'Balance', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="ar-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="ar-tbody">
                {filtered.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafffe' }}>
                    <td className="ar-td bold">{item.invoice_number}</td>
                    <td className="ar-td">{item.customer_name}</td>
                    <td className="ar-td money">{fmt(item.amount)}</td>
                    <td className="ar-td received">{fmt(item.received_amount)}</td>
                    <td className="ar-td due" style={{ color: parseFloat(item.balance) > 0 ? G.error : G.forest }}>
                      {fmt(item.balance)}
                    </td>
                    <td className="ar-td">{dateStr(item.due_date)}</td>
                    <td className="ar-td"><Badge status={item.status} /></td>
                    <td className="ar-td">
                      <div className="ar-td-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {item.status !== 'Received' && (
                          <button className="ar-btn sm pay" onClick={() => { setPayItem(item); setPayForm(emptyPay); }}>
                            <CreditCard size={11} /> Pay
                          </button>
                        )}
                        <button className="ar-btn sm edit" onClick={() => openEdit(item)} title="Edit Invoice">
                          <Pencil size={11} /> Edit
                        </button>
                        <button className="ar-btn sm del" onClick={() => setDeleteItem(item)} title="Delete Invoice">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── ADD Modal ── */}
      {addModal && (
        <div className="ar-overlay">
          <div className="ar-modal">
            <div className="ar-modal-head">
              <span className="ar-modal-title"><Plus size={16} /> Add Customer Invoice</span>
              <button className="ar-modal-close" onClick={() => setAddModal(false)}><X size={16} /></button>
            </div>
            <div className="ar-modal-body">
              <form onSubmit={handleAdd}>
                <InvFormFields />
                <div className="ar-form-footer">
                  <button type="button" className="ar-btn outline" onClick={() => setAddModal(false)}>Cancel</button>
                  <button type="submit" className="ar-btn" disabled={submitting}>{submitting ? 'Saving…' : 'Save Invoice'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT Modal ── */}
      {editItem && (
        <div className="ar-overlay">
          <div className="ar-modal">
            <div className="ar-modal-head">
              <span className="ar-modal-title"><Pencil size={16} /> Edit Invoice — {editItem.invoice_number}</span>
              <button className="ar-modal-close" onClick={() => setEditItem(null)}><X size={16} /></button>
            </div>
            <div className="ar-modal-body">
              {/* Already-received info */}
              {parseFloat(editItem.received_amount) > 0 && (
                <div className="ar-info-strip" style={{ marginBottom: '1rem' }}>
                  <span className="lbl">Already Received (locked)</span>
                  <span className="val">{fmt(editItem.received_amount)}</span>
                  <span className="meta">Amount cannot be reduced below this value</span>
                </div>
              )}
              <form onSubmit={handleEdit}>
                <InvFormFields />
                <div className="ar-form-footer">
                  <button type="button" className="ar-btn outline" onClick={() => setEditItem(null)}>Cancel</button>
                  <button type="submit" className="ar-btn edit" disabled={submitting}>{submitting ? 'Updating…' : 'Update Invoice'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── PAY Modal ── */}
      {payItem && (
        <div className="ar-overlay">
          <div className="ar-modal">
            <div className="ar-modal-head">
              <span className="ar-modal-title"><CreditCard size={16} /> Record Payment</span>
              <button className="ar-modal-close" onClick={() => setPayItem(null)}><X size={16} /></button>
            </div>
            <div className="ar-modal-body">
              <div className="ar-info-strip">
                <span className="lbl">Outstanding Balance</span>
                <span className="val">{fmt(payItem.balance)}</span>
                <span className="meta">{payItem.invoice_number} · {payItem.customer_name}</span>
              </div>
              <form onSubmit={handlePay}>
                <div className="ar-form-group">
                  <label className="ar-label">Amount Received (ETB) *</label>
                  <input required type="number" min="0.01" max={payItem.balance} step="0.01" className="ar-input" placeholder="0.00" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="ar-form-grid">
                  <div className="ar-form-group">
                    <label className="ar-label">Payment Date *</label>
                    <input required type="date" className="ar-input" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
                  </div>
                  <div className="ar-form-group">
                    <label className="ar-label">Payment Method *</label>
                    <select required className="ar-select" value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                </div>
                <div className="ar-form-group">
                  <label className="ar-label">Notes</label>
                  <input className="ar-input" placeholder="Transaction reference or notes…" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="ar-form-footer">
                  <button type="button" className="ar-btn outline" onClick={() => setPayItem(null)}>Cancel</button>
                  <button type="submit" className="ar-btn pay" disabled={submitting}>{submitting ? 'Processing…' : 'Confirm Payment'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE Modal ── */}
      {deleteItem && (
        <div className="ar-overlay">
          <div className="ar-modal">
            <div className="ar-modal-head" style={{ background: G.error }}>
              <span className="ar-modal-title"><AlertCircle size={16} /> Confirm Delete</span>
              <button className="ar-modal-close" onClick={() => setDeleteItem(null)}><X size={16} /></button>
            </div>
            <div className="ar-modal-body">
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: G.dark, marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Are you sure you want to delete invoice <strong style={{ color: G.error }}>{deleteItem.invoice_number}</strong> for <strong>{deleteItem.customer_name}</strong>?
                <br /><br />
                This action cannot be undone.
              </div>
              <div className="ar-form-footer">
                <button type="button" className="ar-btn outline" onClick={() => setDeleteItem(null)}>Cancel</button>
                <button type="button" className="ar-btn del" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      <div className="ar-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`ar-toast${t.type === 'error' ? ' error' : ''}`}>
            {t.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
