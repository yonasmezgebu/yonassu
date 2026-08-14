import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, CheckCircle, AlertCircle, X, RefreshCw,
  FileText, Users, TrendingUp, DollarSign, Clock, CreditCard, Pencil, Trash2
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── ENTERPRISE PALETTE (scoped accent) ─────────────────────────────
const G = {
  dark:    '#2563EB',
  forest:  '#16A34A',
  emerald: '#16A34A',
  error:   '#DC2626',
  olive:   '#D97706',
};

// ─── GLOBAL CSS ──────────────────────────────────────────────────────
const CSS = `
  .ar-wrap {
    --color-primary:#2563EB; --color-primary-hover:#1D4ED8;
    --color-bg-page:#F5F6FA; --color-bg-card:#FFFFFF; --color-border:#E5E7EB;
    --color-text-primary:#111827; --color-text-secondary:#6B7280; --color-text-muted:#9CA3AF;
    --color-success:#16A34A; --color-success-bg:#DCFCE7;
    --color-danger:#DC2626; --color-danger-bg:#FEE2E2;
    --color-warning:#D97706; --color-warning-bg:#FEF3C7;
    --color-info:#0284C7; --color-info-bg:#E0F2FE;
    --color-gold:#F59E0B; --color-gold-text:#1F2937;
    --transition: 150ms ease-in-out;
    font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: var(--color-bg-page);
    color: var(--color-text-primary);
    min-height: 100vh;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 0;
  }
  .ar-wrap *, .ar-wrap *::before, .ar-wrap *::after { box-sizing: border-box; }
  .ar-wrap h1, .ar-wrap h2, .ar-wrap h3, .ar-wrap h4, .ar-wrap p { line-height: 1.3; }

  /* ── Page header ────────────────────────────── */
  .ar-header {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    padding: 16px 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ar-header-title { font-size: 28px; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 12px; }
  .ar-header-sub { font-size: 12px; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; padding-left: 2px; }

  /* ── Sync button ────────────────────────────── */
  .ar-btn-sync {
    border-radius: 8px; height: 36px; padding: 0 16px;
    background: var(--color-bg-card); color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    font: inherit; font-weight: 500; font-size: 14px;
    display: inline-flex; align-items: center; gap: 8px;
    cursor: pointer; white-space: nowrap;
    transition: background-color var(--transition), border-color var(--transition), color var(--transition);
  }
  .ar-btn-sync:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .ar-btn-sync:disabled { opacity: 0.5; cursor: not-allowed; }

  /* KPI grid */
  .ar-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }

  /* ── KPI card ───────────────────────────────── */
  .ar-kpi-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    padding: 20px;
    display: flex; flex-direction: column; gap: 8px;
    transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
  }
  .ar-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); border-color: var(--color-primary); }
  .ar-kpi-icon { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 8px; }
  .ar-kpi-val { font-size: 24px; font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.3px; margin-top: 4px; line-height: 1.2; }
  .ar-kpi-lbl { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; }
  .ar-kpi-strip { display: none; }

  /* Toolbar */
  .ar-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap;
    padding: 16px 20px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-bottom: none;
    border-radius: 10px 10px 0 0;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .ar-toolbar-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
  .ar-toolbar-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ar-search-wrap { position: relative; display: flex; align-items: center; }
  .ar-search-wrap svg { position: absolute; left: 10px; color: var(--color-text-muted); pointer-events: none; }
  .ar-search {
    height: 36px; width: 220px; padding: 0 12px 0 34px;
    border: 1px solid var(--color-border); border-radius: 8px;
    background: var(--color-bg-card);
    font: inherit; font-size: 14px; font-weight: 400; color: var(--color-text-primary);
    outline: none; transition: border-color var(--transition), box-shadow var(--transition);
  }
  .ar-search:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .ar-search::placeholder { color: var(--color-text-muted); }

  /* ── Buttons ────────────────────────────────── */
  .ar-btn {
    border-radius: 8px; height: 36px; padding: 0 16px;
    border: 1px solid transparent;
    font: inherit; font-weight: 500; font-size: 14px;
    background: var(--color-primary); color: #fff;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    white-space: nowrap;
    transition: background-color var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition);
  }
  .ar-btn:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .ar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ar-btn.outline { background: var(--color-bg-card); color: var(--color-text-primary); border-color: var(--color-border); }
  .ar-btn.outline:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .ar-btn.sm { height: 32px; padding: 0 12px; font-size: 13px; }
  .ar-btn.pay { background: var(--color-success); }
  .ar-btn.pay:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .ar-btn.edit { background: var(--color-warning); }
  .ar-btn.edit:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .ar-btn.del { background: var(--color-danger); }
  .ar-btn.del:hover:not(:disabled) { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }

  /* Filter pills */
  .ar-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .ar-pill {
    height: 32px; padding: 0 16px; border-radius: 999px;
    border: 1px solid var(--color-border); background: var(--color-bg-card);
    font: inherit; font-size: 13px; font-weight: 500; color: var(--color-text-secondary);
    cursor: pointer; transition: background-color var(--transition), border-color var(--transition), color var(--transition);
  }
  .ar-pill:hover { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }
  .ar-pill.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
  .ar-pill.active:hover { background: var(--color-gold); color: var(--color-gold-text); border-color: var(--color-gold); }

  /* ── Table ──────────────────────────────────── */
  .ar-table-wrap { margin-bottom: 8px; }
  .ar-table-box {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-top: none;
    border-radius: 0 0 10px 10px;
    overflow-x: auto;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .ar-table { width: 100%; border-collapse: collapse; min-width: 700px; }
  .ar-th {
    padding: 12px 16px; background: #F9FAFB;
    color: var(--color-text-secondary);
    font-size: 12px; font-weight: 500;
    text-transform: uppercase; letter-spacing: .05em;
    text-align: left; border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .ar-tbody tr { background: var(--color-bg-card) !important; border-bottom: 1px solid var(--color-border); transition: background-color var(--transition); }
  .ar-tbody tr:last-child { border-bottom: none; }
  .ar-tbody tr:hover { background: #F9FAFB !important; }
  .ar-td { padding: 12px 16px; font-size: 14px; font-weight: 400; color: var(--color-text-primary); vertical-align: middle; }
  .ar-td.bold { font-weight: 600; }
  .ar-td.money { font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .ar-td.received { font-weight: 500; color: var(--color-success); text-align: right; font-variant-numeric: tabular-nums; }
  .ar-td.due { font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .ar-td-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .ar-empty { padding: 48px 24px; text-align: center; }
  .ar-empty-icon { font-size: 40px; margin-bottom: 8px; }
  .ar-empty-msg { font-size: 14px; font-weight: 500; color: var(--color-text-muted); }

  /* Status badge */
  .ar-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; text-transform: capitalize; }
  .ar-badge.pending  { background: var(--color-info-bg); color: var(--color-info); }
  .ar-badge.partial  { background: var(--color-warning-bg); color: var(--color-warning); }
  .ar-badge.received { background: var(--color-success-bg); color: var(--color-success); }
  .ar-badge.overdue  { background: var(--color-danger-bg); color: var(--color-danger); }

  /* ── Modal ──────────────────────────────────── */
  .ar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; justify-content: center; align-items: flex-start; z-index: 1000; padding: 16px; overflow-y: auto; }
  .ar-modal { background: var(--color-bg-card); width: 100%; max-width: 540px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,.25); margin: auto; overflow: hidden; }
  .ar-modal-head { background: var(--color-bg-card) !important; border-bottom: 1px solid var(--color-border); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .ar-modal-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 8px; }
  .ar-modal-close { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; transition: background-color var(--transition), color var(--transition); }
  .ar-modal-close:hover { background: var(--color-gold); color: var(--color-gold-text); }
  .ar-modal-body { padding: 24px; }

  /* ── Info strip (pay / lock notice) ─────────── */
  .ar-info-strip { background: var(--color-info-bg); border: 1px solid var(--color-info); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px; }
  .ar-info-strip .lbl { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; }
  .ar-info-strip .val { font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
  .ar-info-strip .meta { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }

  /* Form */
  .ar-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ar-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .ar-form-group:last-child { margin-bottom: 0; }
  .ar-label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; }
  .ar-input, .ar-select {
    width: 100%; height: 36px; padding: 0 12px;
    border: 1px solid var(--color-border); border-radius: 8px;
    background: var(--color-bg-card);
    font: inherit; font-size: 14px; font-weight: 400; color: var(--color-text-primary);
    outline: none; transition: border-color var(--transition), box-shadow var(--transition);
    appearance: auto;
  }
  .ar-input:focus, .ar-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
  .ar-input::placeholder { color: var(--color-text-muted); }
  .ar-form-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); flex-wrap: wrap; }

  /* ── Toasts ─────────────────────────────────── */
  .ar-toasts { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 9000; pointer-events: none; }
  .ar-toast {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; min-width: 240px; max-width: 360px;
    background: var(--color-text-primary); color: #fff;
    border-left: 4px solid var(--color-success); border-radius: 8px;
    font-size: 14px; font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    animation: ar-slidein 0.28s cubic-bezier(0.16,1,0.3,1);
    pointer-events: all;
  }
  .ar-toast.error { background: var(--color-danger); border-left-color: var(--color-danger-bg); }
  @keyframes ar-slidein { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* ── Responsive ─────────────────────────────── */
  @media (max-width: 768px) {
    .ar-header, .ar-toolbar { padding: 12px 16px; }
    .ar-header-title { font-size: 24px; }
    .ar-search-wrap { flex: 1 1 100%; }
    .ar-search { width: 100%; }
    .ar-btn, .ar-btn.sm, .ar-pill, .ar-btn-sync { height: 44px; }
  }
  @media (max-width: 480px) {
    .ar-header-title { font-size: 22px; }
    .ar-modal-body { padding: 16px; }
    .ar-modal { max-width: 100%; }
    .ar-overlay { padding: 8px; }
    .ar-form-grid { grid-template-columns: 1fr; }
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
