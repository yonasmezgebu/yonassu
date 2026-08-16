import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import {
  Users, UserPlus, Search, RefreshCw, Mail, Phone, Building2, Tag,
  Download, Loader2, AlertCircle, Truck, CheckCircle2, XCircle,
  ShieldCheck, Clock, CheckSquare, X, CreditCard, MapPin, Globe,
  Landmark, BadgeCheck, CircleDot
} from 'lucide-react';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

/* ─── Styles ─────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* Base page wrapper */
  .psl-page {
    padding: 24px;
    background: #F5F6FA;
    min-height: 100vh;
    font-family: 'Inter', -apple-system, sans-serif;
    box-sizing: border-box;
    color: #111827;
    max-width: 1536px;
    margin: 10px auto;
  }
  @media (max-width:1024px) { .psl-page { padding: 16px; margin: 6px auto; } }
  @media (max-width:768px) { .psl-page { padding: 12px; margin: 4px auto; } }

  /* Header */
  .psl-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .psl-title { font-size:28px; font-weight:700; color:#111827; margin:0; line-height:1.3; }
  .psl-sub { font-size:14px; color:#6B7280; margin:4px 0 0; font-weight:400; line-height:1.5; }

  /* Tabs */
  .psl-tabs { display:flex; gap:8px; margin-bottom:24px; overflow-x:auto; scroll-snap-type:x mandatory; padding-bottom:4px; }
  .psl-tab { padding:0 16px; border:1px solid transparent; border-radius:8px; font-size:14px; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 150ms ease; background:#FFFFFF; color:#6B7280; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); scroll-snap-align: start; white-space:nowrap; height: 36px;}
  .psl-tab.active { background:#EFF6FF; color:#2563EB; border-color:#2563EB; box-shadow: 0 1px 3px rgba(37,99,235,0.1); }
  .psl-tab:not(.active):hover { background:#F9FAFB; color:#111827; }
  .psl-tab-count { background:#F3F4F6; border-radius:10px; padding:2px 8px; font-size:12px; font-weight:600; color:#6B7280; }
  .psl-tab.active .psl-tab-count { background:#DBEAFE; color:#1D4ED8; }

  /* Stats Cards */
  .psl-stats { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px; }
  .psl-stat { background:#FFFFFF; border:1px solid #E5E7EB; border-radius:10px; padding:20px 24px; box-shadow:0 1px 3px rgba(0,0,0,0.06); transition:all 150ms ease; }
  .psl-stat:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); transform:translateY(-1px); }
  .psl-stat-num { font-size:24px; font-weight:700; color:#111827; margin:0 0 4px; line-height:1.3; }
  .psl-stat-label { font-size:13px; font-weight:500; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.03em; }

  /* Toolbar */
  .psl-toolbar { display:flex; gap:8px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
  .psl-search-wrap { position:relative; flex:1; min-width:240px; }
  .psl-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9CA3AF; pointer-events:none; }
  .psl-search { width:100%; box-sizing:border-box; height:36px; padding:0 12px 0 36px; border:1px solid #E5E7EB; border-radius:8px; font-size:14px; outline:none; transition:border-color 150ms ease; }
  .psl-search:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
  .psl-select { height:36px; padding:0 32px 0 12px; border:1px solid #E5E7EB; border-radius:8px; font-size:14px; outline:none; color:#111827; cursor:pointer; background:#FFFFFF url('data:image/svg+xml;utf8,<svg fill="none" stroke="%236B7280" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>') no-repeat right 12px center/14px; appearance:none; transition: border-color 150ms ease;}
  .psl-select:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
  .psl-select:hover { background-color: #F9FAFB; }

  /* Bulk Action Bar */
  .psl-bulk-bar { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:12px 20px; display:flex; align-items:center; gap:16px; margin-bottom:16px; color:#1D4ED8; flex-wrap:wrap; }
  .psl-bulk-count { font-size:14px; font-weight:600; flex:1; margin:0; }
  .psl-btn-gmail { background:#FFFFFF; color:#2563EB; border:1px solid #BFDBFE; border-radius:8px; height:36px; padding:0 16px; font-weight:500; font-size:14px; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 150ms ease; }
  .psl-btn-gmail:hover { background:#D97706; color:#FFFFFF; border-color:#D97706; }
  .psl-btn-deselect { background:transparent; color:#6B7280; border:1px solid #D1D5DB; border-radius:8px; height:36px; padding:0 16px; font-weight:500; font-size:14px; cursor:pointer; transition:all 150ms ease; }
  .psl-btn-deselect:hover { background:#F3F4F6; color:#111827; }

  /* Table Container (Card) */
  .psl-card { background:#FFFFFF; border:1px solid #E5E7EB; border-radius:10px; overflow-x:auto; box-shadow:0 1px 3px rgba(0,0,0,0.06); transition:box-shadow 150ms ease, transform 150ms ease; }
  .psl-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); transform:translateY(-1px); }

  /* Table */
  .psl-table { width:100%; border-collapse:collapse; font-size:14px; min-width: 900px;}
  .psl-table th { background:#F9FAFB; border-bottom:1px solid #E5E7EB; padding:12px 16px; text-align:left; font-size:12px; font-weight:500; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.03em; white-space:nowrap; }
  .psl-table td { padding:12px 16px; border-bottom:1px solid #E5E7EB; vertical-align:middle; color:#111827; }
  .psl-table tbody tr { transition:background 150ms ease; }
  .psl-table tbody tr:hover { background:#F9FAFB; }
  .psl-table tbody tr.selected { background:#EFF6FF; }
  .psl-table tbody tr:last-child td { border-bottom:none; }
  .psl-name { font-weight:600; color:#111827; }
  .psl-email { color:#2563EB; font-size:13px; text-decoration:none; transition:color 150ms ease; }
  .psl-email:hover { color:#1D4ED8; text-decoration:underline; }
  .psl-phone { color:#6B7280; font-size:13px; }
  .psl-company { color:#6B7280; font-size:13px; }
  .psl-cat-badge { display:inline-block; padding:2px 10px; border-radius:9999px; font-size:12px; font-weight:500; background:#F3F4F6; color:#4B5563; }
  .psl-date { color:#9CA3AF; font-size:13px; }
  .psl-checkbox { width:16px; height:16px; cursor:pointer; accent-color:#2563EB; border-radius: 4px; border: 1px solid #D1D5DB; }

  /* Status badges */
  .badge { display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:9999px; font-size:12px; font-weight:500; }
  .badge-pending  { background:#FEF3C7; color:#D97706; }
  .badge-verified { background:#E0F2FE; color:#0284C7; }
  .badge-active   { background:#DCFCE7; color:#16A34A; }
  .badge-rejected { background:#FEE2E2; color:#DC2626; }

  /* Buttons */
  .psl-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:36px; padding:0 16px; border-radius:8px; font-weight:500; font-size:14px; cursor:pointer; transition:all 150ms ease; border:none; outline:none; font-family:'Inter',sans-serif; }
  .psl-btn:disabled { opacity:0.5; cursor:not-allowed; pointer-events:none; }
  .psl-btn-sm { height:32px; padding:0 12px; font-size:13px; }

  /* Button Variants */
  .psl-btn-green { background:#16A34A; color:#FFFFFF; }
  .psl-btn-green:hover { background:#D97706; color:#FFFFFF; }
  .psl-btn-outline { background:#FFFFFF; color:#6B7280; border:1px solid #E5E7EB; }
  .psl-btn-outline:hover { background:#D97706; color:#FFFFFF; border-color:#D97706; }
  .psl-btn-verify { background:#2563EB; color:#FFFFFF; }
  .psl-btn-verify:hover { background:#D97706; color:#FFFFFF; }

  /* Empty State */
  .psl-empty { text-align:center; padding:60px 24px; color:#9CA3AF; }
  .psl-empty h3 { margin:16px 0 8px; color:#111827; font-size:18px; font-weight:600; }
  .psl-empty p { margin:0; font-size:14px; color:#6B7280; }

  /* Mobile Cards View */
  @media (max-width:768px) {
    .psl-table { display:none; }
    .psl-mob-cards { display:flex !important; flex-direction:column; gap:16px; padding:16px; }
    .psl-mob-card { background:#FFFFFF; border:1px solid #E5E7EB; border-radius:10px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,0.06); transition:transform 150ms ease, box-shadow 150ms ease;}
    .psl-mob-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .psl-mob-card h4 { margin:0 0 8px; color:#111827; font-size:16px; font-weight:600; }
    .psl-mob-card p { margin:0 0 6px; font-size:14px; color:#6B7280; display:flex; align-items:center; gap: 6px;}
  }
  @media (min-width:769px) { .psl-mob-cards { display:none; } }

  /* Toast Notification */
  .psl-toast { position:fixed; bottom:24px; right:24px; z-index:99999; padding:16px 20px; border-radius:10px; font-size:14px; font-weight:500; display:flex; align-items:center; gap:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); animation:psl-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1); background:#FFFFFF; color:#111827; border-left:4px solid transparent; }
  .psl-toast-success { border-left-color:#16A34A; }
  .psl-toast-error   { border-left-color:#DC2626; }
  @keyframes psl-slide { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }

  /* ── Verification Drawer ── */
  .vd-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9000; display:flex; justify-content:flex-end; }
  .vd-drawer { width:500px; max-width:100vw; background:#FFFFFF; height:100%; overflow-y:auto; box-shadow:-8px 0 32px rgba(0,0,0,0.1); display:flex; flex-direction:column; animation:vd-slide 0.3s cubic-bezier(0.16,1,0.3,1); }
  @keyframes vd-slide { from { transform:translateX(100%); } to { transform:translateX(0); } }
  .vd-head { padding:24px; border-bottom:1px solid #E5E7EB; display:flex; align-items:center; gap:12px; position:sticky; top:0; background:#FFFFFF; z-index:10; }
  .vd-head h2 { margin:0; font-size:20px; font-weight:600; color:#111827; flex:1; }
  .vd-close { background:transparent; border:none; cursor:pointer; color:#9CA3AF; padding:8px; border-radius:8px; display:flex; transition:all 150ms ease; }
  .vd-close:hover { background:#F3F4F6; color:#111827; }

  /* Supplier identity in Drawer */
  .vd-supplier-bar { padding:20px 24px; background:#F9FAFB; border-bottom:1px solid #E5E7EB; display:flex; align-items:center; gap:16px; }
  .vd-avatar { width:48px; height:48px; border-radius:50%; background:#2563EB; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:18px; flex-shrink:0; }
  .vd-supplier-name { font-weight:600; color:#111827; font-size:16px; margin-bottom:4px; }
  .vd-supplier-meta { font-size:13px; color:#6B7280; }
  .vd-body { padding:24px; flex:1; }

  .vd-section { margin-bottom:32px; }
  .vd-section-title { font-size:13px; font-weight:500; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.03em; margin:0 0 16px; display:flex; align-items:center; gap:8px; }

  .vd-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .vd-field { display:flex; flex-direction:column; gap:6px; }
  .vd-field.full { grid-column:1/-1; }
  .vd-label { font-size:13px; font-weight:500; color:#6B7280; display:flex; align-items:center; gap:6px;}
  .vd-input, .vd-select { width:100%; box-sizing:border-box; height:36px; padding:0 12px; border:1px solid #E5E7EB; border-radius:8px; font-size:14px; font-family:'Inter',sans-serif; outline:none; transition:border-color 150ms ease, box-shadow 150ms ease; background:#FFFFFF; color:#111827; }
  .vd-input:focus, .vd-select:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
  .vd-select { appearance:none; background-image:url('data:image/svg+xml;utf8,<svg fill="none" stroke="%236B7280" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>'); background-repeat:no-repeat; background-position:right 12px center; background-size:14px; padding-right:32px; cursor:pointer;}
  .vd-select:hover { background-color: #F9FAFB; }

  .vd-footer { padding:20px 24px; border-top:1px solid #E5E7EB; display:flex; justify-content:flex-end; gap:12px; position:sticky; bottom:0; background:#FFFFFF; z-index:10; }
  .vd-btn-cancel { background:#FFFFFF; color:#6B7280; border:1px solid #E5E7EB; border-radius:8px; height:36px; padding:0 24px; font-size:14px; font-weight:500; cursor:pointer; font-family:'Inter',sans-serif; transition:all 150ms ease; display:inline-flex; align-items:center; justify-content:center;}
  .vd-btn-cancel:hover { background:#D97706; color:#FFFFFF; border-color:#D97706; }
  .vd-btn-verify { background:#2563EB; color:#FFFFFF; border:none; border-radius:8px; height:36px; padding:0 24px; font-size:14px; font-weight:500; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:'Inter',sans-serif; transition:all 150ms ease; flex:1; }
  .vd-btn-verify:hover:not(:disabled) { background:#D97706; }
  .vd-btn-verify:disabled { opacity:0.5; cursor:not-allowed; }

  .vd-stage1 { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:10px; padding:20px; margin-bottom:32px; }
  .vd-stage1-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E5E7EB; font-size:14px; }
  .vd-stage1-row:last-child { border:none; padding-bottom:0; }
  .vd-stage1-row:first-child { padding-top:0; }
  .vd-stage1-label { color:#6B7280; font-weight:500; }
  .vd-stage1-value { color:#111827; font-weight:500; text-align:right; max-width:60%; word-break:break-word; }

  /* Centered Modal */
  .psl-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; justify-content: center; align-items: center; padding: 20px;
  }
  .psl-modal-content {
    background: #fff; width: 800px; max-width: 100%; border-radius: 12px;
    display: flex; flex-direction: column; max-height: 90vh;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  }
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
            {saving ? <SegmentedSpinner size={16} /> : <ShieldCheck size={16}/>}
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

  const [showAddInternal, setShowAddInternal] = useState(false);
  const [internalForm, setInternalForm] = useState({
    full_name: '', email: '', phone: '', company_name: '', category: ''
  });
  const [savingInternal, setSavingInternal] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);
      if (activeTab === 'internal') params.append('source', 'Internal');
      const res = await apiClient.get(`/suppliers?${params.toString()}`);
      setSuppliers(res.data?.data || []);
    } catch (err) {
      console.error('Fetch suppliers error:', err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus, activeTab]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(selected.size === suppliers.length ? new Set() : new Set(suppliers.map(s => s.id)));

  const handleAddInternal = async (e) => {
    e.preventDefault();
    setSavingInternal(true);
    try {
      const res = await apiClient.post('/suppliers/internal', internalForm);
      showToast('Internal supplier registered successfully!');
      setShowAddInternal(false);
      setInternalForm({ full_name: '', email: '', phone: '', company_name: '', category: '' });
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to register internal supplier', 'error');
    } finally {
      setSavingInternal(false);
    }
  };

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
          <button className={`psl-tab ${activeTab==='registered'?'active':''}`} onClick={() => { setActiveTab('registered'); setSearch(''); }}>
            <Truck size={15}/> Self-Registered
          </button>
          <button className={`psl-tab ${activeTab==='internal'?'active':''}`} onClick={() => { setActiveTab('internal'); setSearch(''); }}>
            <Users size={15}/> Internal
          </button>
        </div>

        {/* Stats */}
        <div className="psl-stats">
          <div className="psl-stat"><p className="psl-stat-num">{suppliers.length}</p><p className="psl-stat-label">Total</p></div>
          <div className="psl-stat"><p className="psl-stat-num" style={{color:'#D97706'}}>{pendingCount}</p><p className="psl-stat-label">Pending</p></div>
          <div className="psl-stat"><p className="psl-stat-num" style={{color:'#0284C7'}}>{verifiedCount}</p><p className="psl-stat-label">Verified</p></div>
          <div className="psl-stat"><p className="psl-stat-num" style={{color:'#16A34A'}}>{activeCount}</p><p className="psl-stat-label">Active</p></div>
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
          {activeTab === 'internal' && (
            <button className="psl-btn psl-btn-green" onClick={() => setShowAddInternal(true)} style={{marginLeft: 'auto'}}>
              <UserPlus size={15}/> Add Internal Supplier
            </button>
          )}
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
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:60,gap:12,color:'#2563EB'}}>
              <SegmentedSpinner size={28} /> <span style={{fontWeight:500}}>Loading suppliers...</span>
            </div>
          ) : error ? (
            <div className="psl-empty">
              <AlertCircle size={40} color="#DC2626"/><h3>Error</h3><p>{error}</p>
              <button className="psl-btn psl-btn-green" style={{margin:'16px auto 0',display:'inline-flex'}} onClick={fetchSuppliers}><RefreshCw size={14}/> Retry</button>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="psl-empty">
              <Truck size={48} color="#E5E7EB"/>
              <h3>No {activeTab === 'internal' ? 'Internal' : 'Registered'} Suppliers Yet</h3>
              <p>{activeTab === 'internal' ? 'Click "Add Internal Supplier" to create one.' : 'Customers who register as suppliers will appear here.'}</p>
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
                          <div style={{width:32,height:32,borderRadius:'50%',background:'#2563EB',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:'13px',flexShrink:0}}>
                            {s.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span>{s.full_name}</span>
                        </div>
                      </td>
                      <td><a href={`mailto:${s.email}`} className="psl-email">{s.email || '—'}</a></td>
                      <td className="psl-phone">{s.phone||'—'}</td>
                      <td className="psl-company">
                        <span style={{display:'flex',alignItems:'center',gap:5}}>
                          <Building2 size={13} color="#9CA3AF"/>
                          {s.company_name||<em style={{color:'#9CA3AF'}}>Individual</em>}
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
                    <p><Mail size={12} color="#6B7280" />{s.email || '—'}</p>
                    <p><Phone size={12} color="#6B7280" />{s.phone||'—'}</p>
                    <p><Tag size={12} color="#6B7280" />{s.category}</p>
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
      </div>

      {/* Add Internal Supplier Modal */}
      {showAddInternal && (
        <div className="psl-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddInternal(false)}>
          <div className="psl-modal-content">
            <div className="vd-head" style={{borderRadius: '12px 12px 0 0'}}>
              <UserPlus size={22} color="#2563EB" />
              <h2>Add Internal Supplier</h2>
              <button className="vd-close" onClick={() => setShowAddInternal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddInternal} style={{display:'flex', flexDirection:'column', flex: 1}}>
              <div className="vd-body">
                <div className="vd-section">
                  <div className="vd-grid">
                    <div className="vd-field full">
                      <label className="vd-label">Full Name / Contact Person *</label>
                      <input required className="vd-input" value={internalForm.full_name} onChange={e=>setInternalForm({...internalForm, full_name: e.target.value})} placeholder="e.g. Yonas Mezgebu" />
                    </div>
                    <div className="vd-field full">
                      <label className="vd-label">Company Name (Optional)</label>
                      <input className="vd-input" value={internalForm.company_name} onChange={e=>setInternalForm({...internalForm, company_name: e.target.value})} placeholder="e.g. Acme Corp" />
                    </div>
                    <div className="vd-field">
                      <label className="vd-label">Email</label>
                      <input type="email" className="vd-input" value={internalForm.email} onChange={e=>setInternalForm({...internalForm, email: e.target.value})} placeholder="supplier@example.com" />
                    </div>
                    <div className="vd-field">
                      <label className="vd-label">Phone</label>
                      <input type="tel" className="vd-input" value={internalForm.phone} onChange={e=>setInternalForm({...internalForm, phone: e.target.value})} placeholder="+251..." />
                    </div>
                    <div className="vd-field full">
                      <label className="vd-label">Category *</label>
                      <select required className="vd-select" value={internalForm.category} onChange={e=>setInternalForm({...internalForm, category: e.target.value})}>
                        <option value="">Select Category...</option>
                        <option>Agriculture</option>
                        <option>Automotive</option>
                        <option>Construction</option>
                        <option>Electronics</option>
                        <option>Pharmaceuticals</option>
                        <option>Retail</option>
                        <option>Services</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="vd-footer" style={{borderRadius: '0 0 12px 12px'}}>
                <button type="button" className="vd-btn-cancel" onClick={() => setShowAddInternal(false)}>Cancel</button>
                <button type="submit" className="vd-btn-verify" disabled={savingInternal}>
                  {savingInternal ? <SegmentedSpinner size={16} /> : <UserPlus size={16}/>}
                  {savingInternal ? 'Saving...' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`psl-toast psl-toast-${toast.type}`}>
          {toast.type==='success'?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>} {toast.msg}
        </div>
      )}
    </>
  );
};

export default PurchaseSupplierList;
