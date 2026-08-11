import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, X, Edit3, Trash2, MapPin, Phone, Clock,
  User, Hash, CheckCircle, XCircle, Save, RotateCcw,
  ShieldCheck, AlertTriangle, RefreshCw
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── Branch-page scoped CSS (enterprise 24-rule system) ──────────────────────
const BRANCH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── Keyframes ── */
  @keyframes pb-fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pb-slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pb-toastIn { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }

  /* ── Page root ── */
  .pb-root {
    font-family: 'Inter','Segoe UI','Roboto',-apple-system,sans-serif;
    background: #F5F6FA;
    min-height: calc(100vh - 60px);
    padding: 10px;
    box-sizing: border-box;
    color: #111827;
  }
  @media (max-width:1024px) { .pb-root { padding:6px; } }
  @media (max-width:768px)  { .pb-root { padding:4px; } }

  /* ── Inner content cap ── */
  .pb-inner {
    max-width: 1536px;
    margin: 0 auto;
    padding: 24px;
    box-sizing: border-box;
  }
  @media (max-width:1024px) { .pb-inner { padding:16px; } }
  @media (max-width:768px)  { .pb-inner { padding:12px; } }

  /* ── Header bar ── */
  .pb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    animation: pb-fadeUp .3s ease;
    flex-wrap: wrap;
  }
  .pb-header-left { display:flex; flex-direction:column; gap:4px; }
  .pb-title {
    font-size: 26px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pb-subtitle {
    font-size: 13px;
    color: #6B7280;
    margin: 0;
    font-weight: 400;
  }
  .pb-header-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

  /* ── Info/summary bar ── */
  .pb-infobar {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    animation: pb-fadeUp .35s ease;
  }
  .pb-infobar-icon {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: #EFF6FF;
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    color: #2563EB;
  }
  .pb-infobar-text h3 {
    font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 2px;
  }
  .pb-infobar-text p {
    font-size: 13px; color: #6B7280; margin: 0; line-height: 1.5;
  }

  /* ── Form card ── */
  .pb-form-card {
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    margin-bottom: 24px;
    overflow: hidden;
    animation: pb-fadeUp .3s ease;
  }
  .pb-form-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: #F9FAFB;
    border-bottom: 1px solid #E5E7EB;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }
  .pb-form-header svg { color: #2563EB; }
  .pb-form-body { padding: 20px 24px; }

  /* ── Form grid ── */
  .pb-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width:768px) { .pb-form-grid { grid-template-columns: 1fr; } }
  .pb-form-grid-full { grid-column: 1 / -1; }

  /* ── Field label ── */
  .pb-field-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 6px;
  }
  .pb-field-label .req { color: #DC2626; margin-left: 2px; }

  /* ── Input with icon ── */
  .pb-field-wrap { position: relative; }
  .pb-field-wrap svg {
    position: absolute; left: 11px; top: 50%; transform:translateY(-50%);
    color: #9CA3AF; pointer-events: none;
  }
  .pb-field-wrap textarea ~ svg,
  .pb-field-wrap.pb-textarea-wrap svg { top: 12px; transform: none; }
  .pb-input {
    width: 100%;
    height: 36px;
    padding: 0 12px 0 34px;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    color: #111827;
    background: #ffffff;
    outline: none;
    box-sizing: border-box;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  .pb-input:focus {
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  }
  .pb-input::placeholder { color: #9CA3AF; }
  textarea.pb-input {
    height: auto;
    padding: 8px 12px 8px 34px;
    resize: vertical;
    min-height: 64px;
  }

  /* ── Checkbox row ── */
  .pb-checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 36px;
    cursor: pointer;
    user-select: none;
  }
  .pb-checkbox-row input[type="checkbox"] {
    width: 16px; height: 16px;
    accent-color: #2563EB;
    cursor: pointer;
  }
  .pb-checkbox-label {
    font-size: 14px; font-weight: 500; color: #111827;
  }

  /* ── Form actions ── */
  .pb-form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #E5E7EB;
    flex-wrap: wrap;
  }

  /* ── Buttons (all variants) ── */
  .pb-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    white-space: nowrap;
    border: 1px solid #E5E7EB;
    background: #ffffff;
    color: #111827;
    box-shadow: 0 1px 2px rgba(0,0,0,.05);
    text-decoration: none;
    font-family: inherit;
  }
  .pb-btn:hover:not(:disabled) {
    background: #FBBF24;
    border-color: #F59E0B;
    color: #111827;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(251,191,36,.25);
  }
  .pb-btn:active:not(:disabled) { transform: translateY(0); }
  .pb-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Primary */
  .pb-btn-primary {
    background: #2563EB;
    border-color: #2563EB;
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(37,99,235,.25);
  }
  .pb-btn-primary:hover:not(:disabled) {
    background: #FBBF24;
    border-color: #F59E0B;
    color: #111827;
    box-shadow: 0 4px 12px rgba(251,191,36,.3);
  }

  /* Danger */
  .pb-btn-danger {
    background: transparent;
    border-color: #DC2626;
    color: #DC2626;
  }
  .pb-btn-danger:hover:not(:disabled) {
    background: #FBBF24;
    border-color: #F59E0B;
    color: #111827;
    box-shadow: 0 4px 8px rgba(251,191,36,.25);
  }

  /* Icon-only (32×32) */
  .pb-btn-icon {
    width: 32px; height: 32px;
    padding: 0;
    justify-content: center;
    border-radius: 8px;
  }

  /* ── Branch grid ── */
  .pb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px,1fr));
    gap: 16px;
  }
  @media (max-width:1024px) { .pb-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width:640px)  { .pb-grid { grid-template-columns: 1fr; } }

  /* ── Branch card ── */
  .pb-card {
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: box-shadow 150ms ease, transform 150ms ease;
    animation: pb-fadeUp .35s ease both;
    position: relative;
    overflow: hidden;
  }
  .pb-card::before {
    content:'';
    position:absolute;
    top:0;left:0;right:0;
    height:3px;
    background:#2563EB;
    opacity:0;
    transition: opacity 150ms ease;
  }
  .pb-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-2px);
  }
  .pb-card:hover::before { opacity:1; }

  /* ── Card header row ── */
  .pb-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .pb-card-icon-wrap {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: #EFF6FF;
    display: flex; align-items:center; justify-content:center;
    flex-shrink:0;
    color: #2563EB;
  }
  .pb-card-name {
    font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 3px;
    line-height: 1.3;
  }
  .pb-card-code {
    font-size: 12px; color: #6B7280; font-family: monospace; font-weight: 500;
  }

  /* ── Card meta list ── */
  .pb-card-meta {
    display: flex; flex-direction: column; gap: 8px;
    font-size: 13px; color: #6B7280;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #F3F4F6;
    flex: 1;
  }
  .pb-card-meta-row {
    display: flex; align-items: flex-start; gap: 8px;
  }
  .pb-card-meta-row svg { flex-shrink:0; margin-top:1px; color: #9CA3AF; }

  /* ── Card action row ── */
  .pb-card-actions {
    display: flex; gap: 8px;
    margin-top: 4px;
  }

  /* ── Badges ── */
  .pb-badge {
    display: inline-flex; align-items:center; gap:4px;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 12px; font-weight: 500;
    white-space: nowrap;
  }
  .pb-badge-active   { background:#DCFCE7; color:#16A34A; }
  .pb-badge-inactive { background:#F3F4F6; color:#6B7280; }

  /* ── Loading / empty states ── */
  .pb-state-center {
    display: flex; flex-direction:column; align-items:center; justify-content:center;
    padding: 80px 24px;
    gap: 16px;
    color: #6B7280;
    text-align: center;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
  }
  .pb-state-center h3 { font-size:16px; font-weight:600; color:#111827; margin:0; }
  .pb-state-center p  { font-size:14px; color:#6B7280; margin:0; }

  /* ── Toast (fixed, top-right) ── */
  .pb-toast {
    position: fixed;
    top: 80px; right: 20px;
    z-index: 9999;
    min-width: 280px; max-width: 380px;
    padding: 14px 18px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    display: flex; align-items:center; gap:12px;
    font-size: 14px; font-weight: 500;
    animation: pb-toastIn 250ms ease;
  }
  .pb-toast-success { border-left:4px solid #16A34A; color:#16A34A; }
  .pb-toast-error   { border-left:4px solid #DC2626; color:#DC2626; }
  .pb-toast-text    { color:#111827; font-weight:400; flex:1; }

  /* ── Confirm modal ── */
  .pb-overlay {
    position:fixed; inset:0;
    background: rgba(0,0,0,.4);
    display:flex; align-items:center; justify-content:center;
    z-index:9998;
    animation: pb-fadeUp .15s ease;
  }
  .pb-modal {
    background:#ffffff;
    border-radius:12px;
    padding:32px 36px;
    max-width:420px; width:100%;
    box-shadow:0 20px 40px rgba(0,0,0,.15);
    animation: pb-fadeUp .2s ease;
    margin:16px;
  }
  .pb-modal h2 { font-size:18px; font-weight:600; color:#111827; margin:0 0 10px; }
  .pb-modal p  { font-size:14px; color:#6B7280; line-height:1.6; margin:0 0 24px; }
  .pb-modal-actions { display:flex; gap:10px; justify-content:flex-end; }

  /* ── Count chip ── */
  .pb-count-chip {
    display:inline-flex; align-items:center;
    padding:2px 10px;
    background:#EFF6FF; color:#2563EB;
    border-radius:9999px;
    font-size:12px; font-weight:600;
    margin-left:8px;
  }

  /* ── Responsive button wrapping ── */
  @media (max-width:640px) {
    .pb-card-actions { flex-wrap:wrap; }
    .pb-card-actions .pb-btn { flex:1; justify-content:center; }
    .pb-header-actions { width:100%; }
    .pb-form-actions .pb-btn { flex:1; justify-content:center; }
  }
`;

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ msg }) => {
  if (!msg?.text) return null;
  return (
    <div className={`pb-toast pb-toast-${msg.type}`}>
      {msg.type === 'success'
        ? <CheckCircle size={18} />
        : <XCircle size={18} />}
      <span className="pb-toast-text">{msg.text}</span>
    </div>
  );
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
const ConfirmModal = ({ text, onConfirm, onCancel }) => (
  <div className="pb-overlay">
    <div className="pb-modal">
      <div style={{ marginBottom: 14, color: '#DC2626' }}>
        <AlertTriangle size={32} />
      </div>
      <h2>Delete this branch?</h2>
      <p>{text}</p>
      <div className="pb-modal-actions">
        <button className="pb-btn" onClick={onCancel}>
          <X size={15} /> Cancel
        </button>
        <button className="pb-btn pb-btn-danger" onClick={onConfirm}
          style={{ background:'#DC2626', borderColor:'#DC2626', color:'#fff' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#FBBF24';e.currentTarget.style.borderColor='#F59E0B';e.currentTarget.style.color='#111827';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#DC2626';e.currentTarget.style.borderColor='#DC2626';e.currentTarget.style.color='#fff';}}>
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Field helper ─────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, name, value, onChange, placeholder, required, type = 'text', rows }) => (
  <div>
    <label className="pb-field-label">
      {label}{required && <span className="req">*</span>}
    </label>
    <div className={`pb-field-wrap${rows ? ' pb-textarea-wrap' : ''}`}>
      <Icon size={14} />
      {rows ? (
        <textarea
          name={name} value={value} onChange={onChange} rows={rows}
          className="pb-input" placeholder={placeholder}
        />
      ) : (
        <input
          type={type} name={name} value={value} onChange={onChange}
          required={required} className="pb-input" placeholder={placeholder}
        />
      )}
    </div>
  </div>
);

// ─── Branch Card ──────────────────────────────────────────────────────────────
const BranchCard = ({ b, onEdit, onDelete, idx }) => (
  <div className="pb-card" style={{ animationDelay: `${idx * 0.06}s` }}>

    {/* Head */}
    <div className="pb-card-head">
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div className="pb-card-icon-wrap">
          <Building2 size={22} />
        </div>
        <div>
          <p className="pb-card-name">{b.name}</p>
          {b.code && <span className="pb-card-code">#{b.code}</span>}
        </div>
      </div>
      <span className={`pb-badge ${b.is_active ? 'pb-badge-active' : 'pb-badge-inactive'}`}>
        {b.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
        {b.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>

    {/* Meta */}
    <div className="pb-card-meta">
      {b.phone && (
        <div className="pb-card-meta-row">
          <Phone size={13} /> <span>{b.phone}</span>
        </div>
      )}
      {b.manager_name && (
        <div className="pb-card-meta-row">
          <User size={13} /> <span>{b.manager_name}</span>
        </div>
      )}
      {b.working_hours && (
        <div className="pb-card-meta-row">
          <Clock size={13} /> <span>{b.working_hours}</span>
        </div>
      )}
      {b.address && (
        <div className="pb-card-meta-row">
          <MapPin size={13} /> <span>{b.address}</span>
        </div>
      )}
      {!b.phone && !b.manager_name && !b.working_hours && !b.address && (
        <span style={{ color:'#9CA3AF', fontSize:13, fontStyle:'italic' }}>No details added</span>
      )}
    </div>

    {/* Actions */}
    <div className="pb-card-actions">
      <button className="pb-btn" style={{ flex:1, justifyContent:'center' }} onClick={() => onEdit(b)}>
        <Edit3 size={14} /> Edit
      </button>
      <button className="pb-btn pb-btn-danger" style={{ flex:1, justifyContent:'center' }} onClick={() => onDelete(b.id)}>
        <Trash2 size={14} /> Delete
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PharmacyBranches = () => {
  const [branches,   setBranches]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [msg,        setMsg]        = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const EMPTY = { name:'', code:'', address:'', phone:'', working_hours:'', manager_name:'', is_active:true };
  const [formData, setFormData] = useState(EMPTY);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyService.getBranches();
      if (res.status === 'success') setBranches(res.data);
    } catch { showMsg('error', 'Failed to load branches'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openForm = (branch = null) => {
    if (branch) {
      setEditing(branch.id);
      setFormData({
        name: branch.name || '', code: branch.code || '', address: branch.address || '',
        phone: branch.phone || '', working_hours: branch.working_hours || '',
        manager_name: branch.manager_name || '',
        is_active: branch.is_active === 1 || branch.is_active === true
      });
    } else { setEditing(null); setFormData(EMPTY); }
    setShowForm(true);
  };

  const handleCancel = () => { setShowForm(false); setEditing(null); setFormData(EMPTY); };
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name.trim()) { showMsg('error', 'Branch name is required'); return; }
    setSaving(true);
    try {
      if (editing) { await pharmacyService.updateBranch(editing, formData); showMsg('success', 'Branch updated!'); }
      else         { await pharmacyService.createBranch(formData);          showMsg('success', 'Branch created!'); }
      handleCancel(); fetchBranches();
    } catch (err) { showMsg('error', err.response?.data?.message || 'Failed to save branch'); }
    finally { setSaving(false); }
  };

  const handleDelete    = id => setConfirmDel(id);
  const confirmDelete   = async () => {
    try {
      await pharmacyService.deleteBranch(confirmDel);
      showMsg('success', 'Branch deleted');
      fetchBranches();
    } catch { showMsg('error', 'Failed to delete branch'); }
    finally { setConfirmDel(null); }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-root">
      <style>{BRANCH_CSS}</style>
      <Toast msg={msg} />
      {confirmDel && (
        <ConfirmModal
          text="This action cannot be undone. All data associated with this branch will be permanently removed."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      <div className="pb-inner">

        {/* ── PAGE HEADER ── */}
        <div className="pb-header">
          <div className="pb-header-left">
            <h1 className="pb-title">
              <Building2 size={24} color="#2563EB" />
              Pharmacy Branches
            </h1>
            <p className="pb-subtitle">
              Manage your pharmacy location network
              <span className="pb-count-chip">{branches.length} {branches.length === 1 ? 'branch' : 'branches'}</span>
            </p>
          </div>

          <div className="pb-header-actions">
            <button
              className="pb-btn"
              onClick={fetchBranches}
              disabled={loading}
              aria-label="Refresh branches"
            >
              {loading ? <SegmentedSpinner size={15} /> : <RefreshCw size={15} />}
              Refresh
            </button>
            <button
              className={`pb-btn ${showForm ? '' : 'pb-btn-primary'}`}
              onClick={() => showForm ? handleCancel() : openForm()}
            >
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? 'Cancel' : 'Add Branch'}
            </button>
          </div>
        </div>

        {/* ── INFO BAR ── */}
        <div className="pb-infobar">
          <div className="pb-infobar-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="pb-infobar-text">
            <h3>Manage Your Branch Network</h3>
            <p>Add, edit, or remove pharmacy locations. Each branch has its own contact details and working hours.</p>
          </div>
        </div>

        {/* ── ADD / EDIT FORM ── */}
        {showForm && (
          <div className="pb-form-card">
            <div className="pb-form-header">
              {editing ? <Edit3 size={16} /> : <Plus size={16} />}
              {editing ? 'Edit Branch' : 'Add New Branch'}
            </div>
            <div className="pb-form-body">
              <form onSubmit={handleSubmit}>
                <div className="pb-form-grid">
                  <Field label="Branch Name"  icon={Building2} name="name"          value={formData.name}          onChange={handleChange} placeholder="e.g. Downtown Pharmacy" required />
                  <Field label="Branch Code"  icon={Hash}      name="code"          value={formData.code}          onChange={handleChange} placeholder="e.g. DTP" />
                  <Field label="Phone"        icon={Phone}     name="phone"         value={formData.phone}         onChange={handleChange} placeholder="+251-XXX-XXXX" />
                  <Field label="Manager Name" icon={User}      name="manager_name"  value={formData.manager_name}  onChange={handleChange} placeholder="Manager full name" />
                  <Field label="Working Hours"icon={Clock}     name="working_hours" value={formData.working_hours} onChange={handleChange} placeholder="Mon–Sat 8 AM – 6 PM" />

                  {/* Active toggle */}
                  <div style={{ display:'flex', alignItems:'flex-end', paddingBottom: 2 }}>
                    <label className="pb-checkbox-row">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                      />
                      <span className="pb-checkbox-label">Active Branch</span>
                    </label>
                  </div>

                  {/* Address — full width */}
                  <div className="pb-form-grid-full">
                    <Field label="Address" icon={MapPin} name="address" value={formData.address} onChange={handleChange} placeholder="Full address" rows={2} />
                  </div>
                </div>

                <div className="pb-form-actions">
                  <button type="submit" disabled={saving} className="pb-btn pb-btn-primary">
                    {saving ? <SegmentedSpinner size={15} /> : <Save size={15} />}
                    {saving ? 'Saving…' : editing ? 'Update Branch' : 'Create Branch'}
                  </button>
                  <button type="button" onClick={handleCancel} className="pb-btn">
                    <X size={15} /> Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── BRANCH GRID ── */}
        {loading ? (
          <div className="pb-state-center">
            <SegmentedSpinner size={40} />
            <p>Loading branches…</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="pb-state-center">
            <Building2 size={48} color="#D1D5DB" />
            <h3>No Branches Yet</h3>
            <p>Click <strong>Add Branch</strong> to register your first pharmacy location.</p>
            <button className="pb-btn pb-btn-primary" onClick={() => openForm()}>
              <Plus size={15} /> Add First Branch
            </button>
          </div>
        ) : (
          <div className="pb-grid">
            {branches.map((b, i) => (
              <BranchCard key={b.id} b={b} idx={i} onEdit={openForm} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default PharmacyBranches;
