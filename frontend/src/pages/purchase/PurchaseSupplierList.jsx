import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import {
  Users, UserPlus, Search, RefreshCw, Mail, Phone, Building2, Tag,
  Download, Loader2, AlertCircle, Truck, CheckCircle2, XCircle,
  ShieldCheck, Clock, CheckSquare, X, CreditCard, MapPin, Globe,
  Landmark, BadgeCheck, CircleDot
} from 'lucide-react';

/* ─── Styles ─────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .psl-page { padding: 28px; background: #F5F5F5; min-height: 100vh; font-family: 'Inter', sans-serif; box-sizing: border-box; }
  @media (max-width:768px){ .psl-page { padding: 16px; } }

  .psl-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .psl-title { font-size:2rem; font-weight:800; color:#1B5E20; margin:0; letter-spacing:-0.02em; }
  .psl-sub { font-size:0.875rem; color:#6B8E23; margin:4px 0 0; font-weight:600; }

  /* Tabs */
  .psl-tabs { display:flex; gap:4px; background:#fff; border:1px solid #E0E0E0; border-radius:12px; padding:5px; margin-bottom:24px; max-width:420px; }
  .psl-tab { flex:1; padding:10px 16px; border:none; border-radius:8px; font-size:0.85rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s; background:transparent; color:#888; font-family:'Inter',sans-serif; }
  .psl-tab.active { background:#1B5E20; color:#fff; box-shadow:0 2px 8px rgba(27,94,32,0.3); }
  .psl-tab:not(.active):hover { background:#F1F8F1; color:#1B5E20; }
  .psl-tab-count { background:rgba(255,255,255,0.25); border-radius:20px; padding:1px 7px; font-size:0.75rem; font-weight:700; }
  .psl-tab:not(.active) .psl-tab-count { background:#E8F5E9; color:#1B5E20; }

  /* Stats */
  .psl-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:14px; margin-bottom:20px; }
  .psl-stat { background:#fff; border:1px solid #E0E0E0; border-radius:12px; padding:18px 20px; }
  .psl-stat-num { font-size:1.8rem; font-weight:800; color:#1B5E20; margin:0 0 4px; }
  .psl-stat-label { font-size:0.72rem; font-weight:700; color:#6B8E23; text-transform:uppercase; letter-spacing:0.08em; }

  /* Toolbar */
  .psl-toolbar { display:flex; gap:12px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
  .psl-search-wrap { position:relative; flex:1; min-width:200px; }
  .psl-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#999; pointer-events:none; }
  .psl-search { width:100%; box-sizing:border-box; padding:10px 12px 10px 38px; border:1px solid #8D6E63; border-radius:8px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s; }
  .psl-search:focus { border-color:#2E8B57; box-shadow:0 0 0 3px rgba(46,139,87,0.1); }
  .psl-select { padding:10px 12px; border:1px solid #8D6E63; border-radius:8px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; color:#333; cursor:pointer; }
  .psl-select:focus { border-color:#2E8B57; }

  /* Bulk bar */
  .psl-bulk-bar { background:linear-gradient(135deg,#1B5E20,#2E8B57); border-radius:10px; padding:12px 20px; display:flex; align-items:center; gap:16px; margin-bottom:16px; color:#fff; flex-wrap:wrap; }
  .psl-bulk-count { font-size:0.875rem; font-weight:700; flex:1; }
  .psl-btn-gmail { background:#fff; color:#1B5E20; border:none; border-radius:8px; padding:9px 20px; font-weight:700; font-size:0.875rem; cursor:pointer; display:flex; align-items:center; gap:8px; font-family:'Inter',sans-serif; transition:transform 0.15s,box-shadow 0.15s; }
  .psl-btn-gmail:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
  .psl-btn-deselect { background:rgba(255,255,255,0.15); color:#fff; border:1.5px solid rgba(255,255,255,0.3); border-radius:8px; padding:9px 16px; font-weight:600; font-size:0.85rem; cursor:pointer; font-family:'Inter',sans-serif; }

  /* Table */
  .psl-card { background:#fff; border:1px solid #E0E0E0; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.04); }
  .psl-table { width:100%; border-collapse:collapse; font-size:0.875rem; }
  .psl-table thead th { background:#F9FBF9; border-bottom:2px solid #E8F5E9; padding:12px 14px; text-align:left; font-size:0.72rem; font-weight:700; color:#6B8E23; text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap; }
  .psl-table tbody tr { border-bottom:1px solid #F5F5F5; transition:background 0.15s; }
  .psl-table tbody tr:hover { background:#FAFFF9; }
  .psl-table tbody tr.selected { background:#F1F8F1; }
  .psl-table td { padding:12px 14px; vertical-align:middle; }
  .psl-name { font-weight:700; color:#1B5E20; }
  .psl-email { color:#0284c7; font-size:0.82rem; }
  .psl-phone { color:#555; font-size:0.82rem; }
  .psl-company { color:#555; font-size:0.82rem; }
  .psl-cat-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700; background:#E8F5E9; color:#2E7D32; }
  .psl-date { color:#999; font-size:0.78rem; }
  .psl-checkbox { width:18px; height:18px; cursor:pointer; accent-color:#2E8B57; }

  /* Status badges */
  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:0.74rem; font-weight:700; }
  .badge-pending  { background:#FFF8E1; color:#F57F17; }
  .badge-verified { background:#E3F2FD; color:#1565C0; }
  .badge-active   { background:#E8F5E9; color:#2E7D32; }
  .badge-rejected { background:#FFEBEE; color:#C62828; }

  /* Buttons */
  .psl-btn { display:flex; align-items:center; gap:6px; padding:10px 16px; border-radius:8px; font-weight:600; font-size:0.85rem; cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; border:none; }
  .psl-btn-green  { background:#2E8B57; color:#fff; }
  .psl-btn-green:hover  { background:#1B5E20; }
  .psl-btn-outline { background:#fff; color:#555; border:1px solid #8D6E63; }
  .psl-btn-outline:hover { background:#F5F5F5; }
  .psl-btn-verify { background:linear-gradient(135deg,#1565C0,#1976D2); color:#fff; }
  .psl-btn-verify:hover { opacity:0.9; }
  .psl-btn-sm { padding:6px 12px; font-size:0.78rem; }

  /* Empty */
  .psl-empty { text-align:center; padding:60px 24px; color:#aaa; }
  .psl-empty h3 { margin:16px 0 8px; color:#555; font-size:1.1rem; }
  .psl-empty p { margin:0; font-size:0.875rem; }

  /* Mobile */
  @media (max-width:640px) {
    .psl-table { display:none; }
    .psl-mob-cards { display:flex !important; flex-direction:column; gap:12px; padding:12px; }
    .psl-mob-card { background:#fff; border:1px solid #E0E0E0; border-radius:10px; padding:16px; }
    .psl-mob-card h4 { margin:0 0 4px; color:#1B5E20; font-size:0.95rem; }
    .psl-mob-card p { margin:0 0 4px; font-size:0.8rem; color:#555; }
  }
  @media (min-width:641px) { .psl-mob-cards { display:none; } }

  /* Toast */
  .psl-toast { position:fixed; bottom:24px; right:24px; z-index:99999; padding:14px 20px; border-radius:12px; font-size:0.875rem; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 8px 24px rgba(0,0,0,0.15); animation:psl-slide 0.3s ease; }
  .psl-toast-success { background:#1B5E20; color:#fff; }
  .psl-toast-error   { background:#C62828; color:#fff; }
  @keyframes psl-slide { from { transform:translateX(110%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* ── Verification Drawer ── */
  .vd-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:9000; display:flex; justify-content:flex-end; }
  .vd-drawer { width:480px; max-width:100vw; background:#fff; height:100%; overflow-y:auto; box-shadow:-8px 0 32px rgba(0,0,0,0.18); display:flex; flex-direction:column; animation:vd-slide 0.28s cubic-bezier(.22,.61,.36,1); }
  @keyframes vd-slide { from { transform:translateX(100%); } to { transform:translateX(0); } }
  .vd-head { padding:24px; border-bottom:2px solid #E8F5E9; display:flex; align-items:center; gap:12px; position:sticky; top:0; background:#fff; z-index:10; }
  .vd-head h2 { margin:0; font-size:1.15rem; font-weight:800; color:#1B5E20; flex:1; }
  .vd-close { background:none; border:none; cursor:pointer; color:#888; padding:4px; border-radius:8px; display:flex; }
  .vd-close:hover { background:#F5F5F5; color:#333; }
  .vd-supplier-bar { padding:16px 24px; background:#F9FBF9; border-bottom:1px solid #E8F5E9; display:flex; align-items:center; gap:14px; }
  .vd-avatar { width:44px; height:44px; border-radius:50%; background:#1B5E20; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.05rem; flex-shrink:0; }
  .vd-supplier-name { font-weight:700; color:#1B5E20; font-size:1rem; }
  .vd-supplier-meta { font-size:0.8rem; color:#777; margin-top:2px; }
  .vd-body { padding:24px; flex:1; }
  .vd-section { margin-bottom:24px; }
  .vd-section-title { font-size:0.72rem; font-weight:700; color:#6B8E23; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 14px; display:flex; align-items:center; gap:8px; }
  .vd-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .vd-field { display:flex; flex-direction:column; gap:5px; }
  .vd-field.full { grid-column:1/-1; }
  .vd-label { font-size:0.75rem; font-weight:700; color:#555; }
  .vd-input { padding:9px 12px; border:1px solid #ccc; border-radius:8px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s; }
  .vd-input:focus { border-color:#1976D2; box-shadow:0 0 0 3px rgba(25,118,210,0.1); }
  .vd-select { padding:9px 12px; border:1px solid #ccc; border-radius:8px; font-size:0.875rem; font-family:'Inter',sans-serif; outline:none; cursor:pointer; background:#fff; }
  .vd-select:focus { border-color:#1976D2; }
  .vd-footer { padding:20px 24px; border-top:1px solid #E8F5E9; display:flex; gap:10px; position:sticky; bottom:0; background:#fff; }
  .vd-btn-verify { flex:1; background:linear-gradient(135deg,#1565C0,#1976D2); color:#fff; border:none; border-radius:10px; padding:13px; font-size:0.9rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Inter',sans-serif; transition:opacity 0.2s; }
  .vd-btn-verify:disabled { opacity:0.6; cursor:not-allowed; }
  .vd-btn-cancel { background:#F5F5F5; color:#555; border:none; border-radius:10px; padding:13px 20px; font-size:0.875rem; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; }
  .vd-stage1 { background:#F9FBF9; border:1px solid #E8F5E9; border-radius:10px; padding:16px; margin-bottom:20px; }
  .vd-stage1-row { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #F0F0F0; font-size:0.82rem; }
  .vd-stage1-row:last-child { border:none; }
  .vd-stage1-label { color:#888; font-weight:600; }
  .vd-stage1-value { color:#333; font-weight:500; text-align:right; max-width:60%; word-break:break-word; }
`;

const COMPANY_NAME = 'SUTANA Trading PLC';

const statusBadge = (status) => {
  const map = {
    Pending:  { cls: 'badge-pending',  icon: <Clock size={11}/>,        label: 'Pending' },
    Verified: { cls: 'badge-verified', icon: <BadgeCheck size={11}/>,   label: 'Verified' },
    Active:   { cls: 'badge-active',   icon: <CheckCircle2 size={11}/>, label: 'Active' },
    Rejected: { cls: 'badge-rejected', icon: <XCircle size={11}/>,      label: 'Rejected' },
  };
  const s = map[status] || map.Pending;
  return <span className={`badge ${s.cls}`}>{s.icon}{s.label}</span>;
};

/* ── Verification Drawer ── */
const VerifyDrawer = ({ supplier, onClose, onVerified }) => {
  const [form, setForm] = useState({
    tax_id:        supplier.tax_id        || '',
    payment_terms: supplier.payment_terms || '',
    credit_limit:  supplier.credit_limit  || '',
    location_type: supplier.location_type || '',
    bank_name:     supplier.bank_name     || '',
    bank_account:  supplier.bank_account  || '',
    bank_holder:   supplier.bank_holder   || '',
    website:       supplier.website       || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/suppliers/${supplier.id}/verify`, form);
      onVerified(res.data.data);
      onClose();
    } catch (e) {
      setToast(e.response?.data?.message || 'Failed to verify supplier');
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const initials = supplier.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="vd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vd-drawer">
        {/* Header */}
        <div className="vd-head">
          <ShieldCheck size={22} color="#1565C0" />
          <h2>Stage 2 — Verification</h2>
          <button className="vd-close" onClick={onClose}><X size={20}/></button>
        </div>

        {/* Supplier identity */}
        <div className="vd-supplier-bar">
          <div className="vd-avatar">{initials}</div>
          <div>
            <div className="vd-supplier-name">{supplier.full_name}</div>
            <div className="vd-supplier-meta">{supplier.email} · {supplier.category}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>{statusBadge(supplier.status)}</div>
        </div>

        <div className="vd-body">
          {/* Stage 1 snapshot (read-only) */}
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B8E23', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Stage 1 — Self-Registered Info</p>
          <div className="vd-stage1">
            {[
              ['Full Name',    supplier.full_name],
              ['Phone',        supplier.phone || '—'],
              ['Company',      supplier.company_name || 'Individual'],
              ['Category',     supplier.category],
              ['Address',      supplier.business_address],
              ['Description',  supplier.description || '—'],
            ].map(([l, v]) => (
              <div className="vd-stage1-row" key={l}>
                <span className="vd-stage1-label">{l}</span>
                <span className="vd-stage1-value">{v}</span>
              </div>
            ))}
          </div>

          {/* Stage 2 fields (staff fills in) */}
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={13}/> Stage 2 — Verification Details (Staff Only)
          </p>

          <div className="vd-grid vd-section">
            <div className="vd-field">
              <label className="vd-label"><Tag size={12} style={{verticalAlign:'middle',marginRight:4}}/>Tax ID</label>
              <input className="vd-input" value={form.tax_id} onChange={e=>set('tax_id',e.target.value)} placeholder="e.g. ETH-1234567" />
            </div>
            <div className="vd-field">
              <label className="vd-label"><CircleDot size={12} style={{verticalAlign:'middle',marginRight:4}}/>Payment Terms</label>
              <select className="vd-select" value={form.payment_terms} onChange={e=>set('payment_terms',e.target.value)}>
                <option value="">Select...</option>
                <option>Net 30</option>
                <option>Net 60</option>
                <option>COD</option>
                <option>Prepaid</option>
              </select>
            </div>
            <div className="vd-field">
              <label className="vd-label"><CreditCard size={12} style={{verticalAlign:'middle',marginRight:4}}/>Credit Limit (ETB)</label>
              <input className="vd-input" type="number" value={form.credit_limit} onChange={e=>set('credit_limit',e.target.value)} placeholder="0.00" />
            </div>
            <div className="vd-field">
              <label className="vd-label"><MapPin size={12} style={{verticalAlign:'middle',marginRight:4}}/>Location Type</label>
              <select className="vd-select" value={form.location_type} onChange={e=>set('location_type',e.target.value)}>
                <option value="">Select...</option>
                <option>Local</option>
                <option>International</option>
              </select>
            </div>
          </div>

          <div className="vd-grid vd-section">
            <div className="vd-field">
              <label className="vd-label"><Landmark size={12} style={{verticalAlign:'middle',marginRight:4}}/>Bank Name</label>
              <input className="vd-input" value={form.bank_name} onChange={e=>set('bank_name',e.target.value)} placeholder="e.g. Commercial Bank of Ethiopia" />
            </div>
            <div className="vd-field">
              <label className="vd-label">Account Number</label>
              <input className="vd-input" value={form.bank_account} onChange={e=>set('bank_account',e.target.value)} placeholder="e.g. 1000123456789" />
            </div>
            <div className="vd-field full">
              <label className="vd-label">Account Holder Name</label>
              <input className="vd-input" value={form.bank_holder} onChange={e=>set('bank_holder',e.target.value)} placeholder="Legal name on the account" />
            </div>
            <div className="vd-field full">
              <label className="vd-label"><Globe size={12} style={{verticalAlign:'middle',marginRight:4}}/>Website (optional)</label>
              <input className="vd-input" value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="vd-footer">
          <button className="vd-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="vd-btn-verify" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <ShieldCheck size={16}/>}
            {saving ? 'Saving...' : 'Confirm Verified'}
          </button>
        </div>

        {toast && (
          <div className="psl-toast psl-toast-error" style={{ zIndex: 99999 }}>
            <AlertCircle size={16}/>{toast}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ── */
const PurchaseSupplierList = () => {
  const [activeTab, setActiveTab] = useState('registered');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSuppliers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);
      const res = await apiClient.get(`/suppliers?${params.toString()}`);
      setSuppliers(res.data?.data || []);
    } catch {
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus]);

  useEffect(() => { if (activeTab === 'registered') fetchSuppliers(); }, [activeTab, fetchSuppliers]);

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(selected.size === suppliers.length ? new Set() : new Set(suppliers.map(s => s.id)));

  const handleEmailSelected = () => {
    const sel = suppliers.filter(s => selected.has(s.id));
    if (!sel.length) { showToast('Select at least one supplier.', 'error'); return; }
    const bcc = sel.map(s => s.email).filter(Boolean).join(',');
    const subject = encodeURIComponent(`Purchase Inquiry — ${COMPANY_NAME}`);
    const body = encodeURIComponent(`Dear Supplier,\n\nWe are ${COMPANY_NAME} and would like to discuss procurement opportunities with you.\n\nBest regards,\nPurchase Department`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bcc)}&su=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    showToast(`Gmail opened with ${sel.length} supplier(s) in Bcc.`);
  };

  const handleExport = () => {
    const headers = ['Full Name','Email','Phone','Company','Category','Status','Tax ID','Payment Terms','Credit Limit','Location','Bank','Account','Registered'];
    const rows = suppliers.map(s => [
      s.full_name, s.email, s.phone, s.company_name||'Individual',
      s.category, s.status, s.tax_id||'', s.payment_terms||'', s.credit_limit||'',
      s.location_type||'', s.bank_name||'', s.bank_account||'',
      s.created_at ? new Date(s.created_at).toLocaleDateString() : ''
    ]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = 'supplier_directory.csv'; a.click();
    showToast('Supplier list exported as CSV.');
  };

  const handleVerified = (updated) => {
    setSuppliers(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    showToast(`${updated.full_name} has been verified successfully!`);
  };

  const handleActivate = async (s) => {
    try {
      const res = await apiClient.patch(`/suppliers/${s.id}/status`, { status: 'Active' });
      setSuppliers(prev => prev.map(x => x.id === s.id ? { ...x, ...res.data.data } : x));
      showToast(`${s.full_name} is now Active.`);
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—';
  const pendingCount   = suppliers.filter(s => s.status === 'Pending').length;
  const verifiedCount  = suppliers.filter(s => s.status === 'Verified').length;
  const activeCount    = suppliers.filter(s => s.status === 'Active').length;
  const uniqueCategories = [...new Set(suppliers.map(s=>s.category).filter(Boolean))].sort();

  return (
    <>
      <style>{STYLES}</style>
      {verifyTarget && (
        <VerifyDrawer
          supplier={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onVerified={handleVerified}
        />
      )}

      <div className="psl-page">
        {/* Header */}
        <div className="psl-header">
          <div>
            <h1 className="psl-title">Supplier Directory</h1>
            <p className="psl-sub">Pending → Verified → Active · Stage 2 verification fills in financial details</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="psl-btn psl-btn-outline" onClick={handleExport}>
              <Download size={15}/> Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="psl-tabs">
          <button className={`psl-tab ${activeTab==='registered'?'active':''}`} onClick={() => setActiveTab('registered')}>
            <Truck size={15}/> Self-Registered <span className="psl-tab-count">{suppliers.length}</span>
          </button>
          <button className={`psl-tab ${activeTab==='internal'?'active':''}`} onClick={() => setActiveTab('internal')}>
            <Users size={15}/> Internal
          </button>
        </div>

        {activeTab === 'registered' ? (
          <>
            {/* Stats */}
            <div className="psl-stats">
              <div className="psl-stat"><p className="psl-stat-num">{suppliers.length}</p><p className="psl-stat-label">Total</p></div>
              <div className="psl-stat"><p className="psl-stat-num" style={{color:'#F57F17'}}>{pendingCount}</p><p className="psl-stat-label">Pending</p></div>
              <div className="psl-stat"><p className="psl-stat-num" style={{color:'#1565C0'}}>{verifiedCount}</p><p className="psl-stat-label">Verified</p></div>
              <div className="psl-stat"><p className="psl-stat-num" style={{color:'#2E7D32'}}>{activeCount}</p><p className="psl-stat-label">Active</p></div>
            </div>

            {/* Toolbar */}
            <div className="psl-toolbar">
              <div className="psl-search-wrap">
                <Search size={15} className="psl-search-icon"/>
                <input className="psl-search" placeholder="Search by name, email, company, category..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="psl-select" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {uniqueCategories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select className="psl-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option>Pending</option>
                <option>Verified</option>
                <option>Active</option>
                <option>Rejected</option>
              </select>
              <button className="psl-btn psl-btn-outline" onClick={fetchSuppliers} title="Refresh"><RefreshCw size={15}/></button>
            </div>

            {/* Bulk bar */}
            {selected.size > 0 && (
              <div className="psl-bulk-bar">
                <p className="psl-bulk-count"><CheckSquare size={16} style={{verticalAlign:'middle',marginRight:6}}/>{selected.size} selected</p>
                <button className="psl-btn-gmail" onClick={handleEmailSelected}><Mail size={16}/> Email via Gmail</button>
                <button className="psl-btn-deselect" onClick={()=>setSelected(new Set())}>Clear</button>
              </div>
            )}

            {/* Table */}
            <div className="psl-card">
              {loading ? (
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:60,gap:12,color:'#2E8B57'}}>
                  <Loader2 size={28} style={{animation:'spin 1s linear infinite'}}/> <span style={{fontWeight:600}}>Loading suppliers...</span>
                </div>
              ) : error ? (
                <div className="psl-empty">
                  <AlertCircle size={40} color="#C62828"/><h3>Error</h3><p>{error}</p>
                  <button className="psl-btn psl-btn-green" style={{margin:'16px auto 0',display:'inline-flex'}} onClick={fetchSuppliers}><RefreshCw size={14}/> Retry</button>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="psl-empty">
                  <Truck size={48} color="#C8E6C9"/><h3>No Suppliers Yet</h3>
                  <p>Customers who register as suppliers will appear here.</p>
                </div>
              ) : (
                <>
                  <table className="psl-table">
                    <thead>
                      <tr>
                        <th style={{width:40}}>
                          <input type="checkbox" className="psl-checkbox" checked={selected.size===suppliers.length && suppliers.length>0} onChange={toggleSelectAll}/>
                        </th>
                        <th>Supplier</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(s => (
                        <tr key={s.id} className={selected.has(s.id)?'selected':''}>
                          <td><input type="checkbox" className="psl-checkbox" checked={selected.has(s.id)} onChange={()=>toggleSelect(s.id)}/></td>
                          <td className="psl-name">
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{width:32,height:32,borderRadius:'50%',background:'#1B5E20',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:'0.85rem',flexShrink:0}}>
                                {s.full_name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span>{s.full_name}</span>
                            </div>
                          </td>
                          <td><a href={`mailto:${s.email}`} className="psl-email" style={{textDecoration:'none'}}>{s.email}</a></td>
                          <td className="psl-phone">{s.phone||'—'}</td>
                          <td className="psl-company">
                            <span style={{display:'flex',alignItems:'center',gap:5}}>
                              <Building2 size={13} color="#aaa"/>
                              {s.company_name||<em style={{color:'#aaa'}}>Individual</em>}
                            </span>
                          </td>
                          <td><span className="psl-cat-badge">{s.category}</span></td>
                          <td>{statusBadge(s.status)}</td>
                          <td className="psl-date">{fmtDate(s.created_at)}</td>
                          <td>
                            <div style={{display:'flex',gap:6}}>
                              {(s.status === 'Pending') && (
                                <button className="psl-btn psl-btn-verify psl-btn-sm" onClick={()=>setVerifyTarget(s)}>
                                  <ShieldCheck size={13}/> Verify
                                </button>
                              )}
                              {s.status === 'Verified' && (
                                <button className="psl-btn psl-btn-green psl-btn-sm" onClick={()=>handleActivate(s)}>
                                  <CheckCircle2 size={13}/> Activate
                                </button>
                              )}
                              {(s.status === 'Active' || s.status === 'Rejected') && (
                                <button className="psl-btn psl-btn-outline psl-btn-sm" onClick={()=>setVerifyTarget(s)}>
                                  <ShieldCheck size={13}/> View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="psl-mob-cards">
                    {suppliers.map(s => (
                      <div key={s.id} className="psl-mob-card">
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <h4>{s.full_name}</h4>
                          <input type="checkbox" className="psl-checkbox" checked={selected.has(s.id)} onChange={()=>toggleSelect(s.id)}/>
                        </div>
                        <p><Mail size={12} color="#6B8E23" style={{verticalAlign:'middle',marginRight:4}}/>{s.email}</p>
                        <p><Phone size={12} color="#6B8E23" style={{verticalAlign:'middle',marginRight:4}}/>{s.phone||'—'}</p>
                        <p><Tag size={12} color="#6B8E23" style={{verticalAlign:'middle',marginRight:4}}/>{s.category}</p>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10}}>
                          {statusBadge(s.status)}
                          {s.status==='Pending' && <button className="psl-btn psl-btn-verify psl-btn-sm" onClick={()=>setVerifyTarget(s)}><ShieldCheck size={12}/> Verify</button>}
                          {s.status==='Verified' && <button className="psl-btn psl-btn-green psl-btn-sm" onClick={()=>handleActivate(s)}><CheckCircle2 size={12}/> Activate</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{background:'#fff',border:'1px solid #E0E0E0',borderRadius:12,padding:40,textAlign:'center',color:'#555'}}>
            <Users size={48} color="#C8E6C9" style={{marginBottom:16}}/>
            <h3 style={{color:'#1B5E20',margin:'0 0 8px'}}>Internal Procurement Suppliers</h3>
            <p style={{margin:'0 0 20px',color:'#888'}}>View and manage internal suppliers for purchase orders and quotations.</p>
          </div>
        )}
      </div>

      {toast && (
        <div className={`psl-toast psl-toast-${toast.type}`}>
          {toast.type==='success'?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>} {toast.msg}
        </div>
      )}
    </>
  );
};

export default PurchaseSupplierList;
