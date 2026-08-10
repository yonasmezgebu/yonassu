import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, X, Edit3, Trash2, MapPin, Phone, Clock,
  User, Hash, CheckCircle, XCircle, Loader2, Save, RotateCcw,
  ShieldCheck, Zap, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import SegmentedSpinner from '../../components/ui/SegmentedSpinner';

// ─── accent colour ──────────────────────────────────────────────────
const C   = '#2563EB';            // Primary Blue
const CD  = '#1D4ED8';            // Primary Hover / Deep Blue
const CL  = 'rgba(37, 99, 235, 0.15)'; // light tint

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { to{opacity:1} }
  @keyframes toastIn  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }

  .b-page {
    max-width:1536px;margin:0 auto;padding:24px 24px;
    box-sizing:border-box;width:100%;
  }

  .b-card {
    position:relative;overflow:hidden;background:white;border-radius:10px;
    border:1px solid #E5E7EB;box-shadow:0 1px 3px rgba(0,0,0,.06);
    transition:all .15s ease;animation:fadeUp .5s ease both;
  }
  .b-card:hover{
    border-color:#F59E0B;box-shadow:0 4px 12px rgba(0,0,0,.08);transform:translateY(-1px);
  }

  .btn-olive {
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    height:44px;padding:0 20px;font-weight:500;font-size:14px;cursor:pointer;
    color:#6B7280;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:8px;
    transition:all .15s ease;font-family:'Inter','Segoe UI',sans-serif;
  }
  .btn-olive:hover:not(:disabled){ background:#F9FAFB;border-color:#D1D5DB;transform:translateY(-1px); }
  .btn-olive:active:not(:disabled){ transform:translateY(0); }
  .btn-olive:focus-visible{ outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.25); }
  .btn-olive:disabled{ opacity:.5;cursor:not-allowed; }

  .btn-olive-primary {
    display:inline-flex;align-items:center;justify-content:center;gap:10px;
    height:44px;padding:0 24px;font-weight:500;font-size:14px;cursor:pointer;
    background:#2563EB;color:white;border:none;border-radius:8px;
    transition:all .15s ease;font-family:'Inter','Segoe UI',sans-serif;
  }
  .btn-olive-primary:hover:not(:disabled){ background:#1D4ED8;transform:translateY(-1px); }
  .btn-olive-primary:active:not(:disabled){ transform:translateY(0); }
  .btn-olive-primary:focus-visible{ outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.25); }
  .btn-olive-primary:disabled{ opacity:.5;cursor:not-allowed; }

  .btn-danger {
    display:inline-flex;align-items:center;justify-content:center;gap:8px;
    height:44px;padding:0 16px;font-weight:500;font-size:14px;cursor:pointer;
    background:#DC2626;color:white;border:none;border-radius:8px;
    transition:all .15s ease;font-family:'Inter','Segoe UI',sans-serif;
  }
  .btn-danger:hover:not(:disabled){ background:#B91C1C;transform:translateY(-1px); }
  .btn-danger:active:not(:disabled){ transform:translateY(0); }
  .btn-danger:focus-visible{ outline:none;box-shadow:0 0 0 3px rgba(220,38,38,.25); }
  .btn-danger:disabled{ opacity:.5;cursor:not-allowed; }

  .btn-gold { position:relative;overflow:hidden;transition:all .15s ease; }
  .btn-gold:hover:not(:disabled){ background:#F59E0B;color:#78350F; }
  .btn-gold::after{
    content:'';position:absolute;top:0;left:-150%;width:50%;height:100%;
    background:linear-gradient(100deg,transparent,rgba(255,214,0,.5),transparent);
    transform:skewX(-20deg);pointer-events:none;opacity:0;z-index:0;
  }
  .btn-gold > * { position:relative;z-index:1; }
  .btn-gold:hover::after{ animation:goldScratch .6s ease forwards; }
  @keyframes goldScratch { 0%{left:-150%;opacity:1} 100%{left:150%;opacity:1} }

  .b-input {
    width:100%;height:36px;padding:0 12px 0 38px;border:1px solid #E5E7EB;border-radius:8px;
    font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;color:#111827;background:#fff;
    transition:all .15s ease;
  }
  .b-input:focus { border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1); }
  .b-input::placeholder { color:#9CA3AF; }

  .b-label { display:block;font-size:12px;font-weight:500;color:#6B7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em; }

  .b-badge-active   { padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;background:#DCFCE7;color:#16A34A;display:inline-flex;align-items:center;gap:5px; }
  .b-badge-inactive { padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;background:#F3F4F6;color:#6B7280;border:1px dashed #E5E7EB;display:inline-flex;align-items:center;gap:5px; }

  .artistic-title {
    font-size:26px;font-weight:600;color:#111827;letter-spacing:-.01em;
    margin:0;display:flex;align-items:center;gap:12px;line-height:1.3;
  }
  .artistic-subtitle {
    font-size:12px;color:#6B7280;font-weight:500;
    text-transform:uppercase;letter-spacing:.08em;margin:0;
  }

  @media(max-width:768px){
    .b-page{ padding:16px 16px; }
    .b-head{ flex-direction:column;align-items:flex-start !important; }
    .btn-olive,.btn-olive-primary,.btn-danger{ min-height:44px; }
  }
  @media(max-width:480px){
    .b-page{ padding:12px 12px; }
    .b-input{ height:44px; }
  }
`;

// ─── Confirm delete modal ────────────────────────────────────────────
const ConfirmModal = ({ text, onConfirm, onCancel }) => (
  <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,animation:'fadeIn .2s ease',padding:16 }}>
    <div style={{ background:'white',padding:24,borderRadius:12,boxShadow:'0 24px 48px rgba(0,0,0,0.2)',maxWidth:420,width:'100%',animation:'fadeUp .3s ease' }}>
      <div style={{ width:48,height:48,borderRadius:999,background:'#FEE2E2',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
        <AlertTriangle size={24} color="#DC2626" />
      </div>
      <h2 style={{ margin:'0 0 8px',fontSize:18,fontWeight:600,color:'#111827',lineHeight:1.3 }}>Are you sure?</h2>
      <p style={{ margin:'0 0 24px',fontSize:14,color:'#6B7280',lineHeight:1.5 }}>{text}</p>
      <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
        <button onClick={onCancel} className="btn-olive">Cancel</button>
        <button onClick={onConfirm} className="btn-danger">Delete</button>
      </div>
    </div>
  </div>
);

// ─── Inline Toast ────────────────────────────────────────────────────
const Toast = ({ msg }) => msg?.text ? (
  <div style={{ position:'fixed',top:20,right:20,zIndex:9999,padding:'14px 18px',borderRadius:8,
    background:'#FFFFFF',borderLeft:`4px solid ${msg.type==='success' ? '#16A34A' : '#DC2626'}`,
    color:'#111827',fontWeight:500,fontSize:14,display:'flex',alignItems:'center',gap:12,
    boxShadow:'0 8px 24px rgba(0,0,0,0.12)',animation:'toastIn .3s ease',minWidth:280,maxWidth:400
  }}>
    <span style={{ color: msg.type==='success' ? '#16A34A' : '#DC2626', flexShrink:0 }}>
      {msg.type==='success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
    </span>
    <span>{msg.text}</span>
  </div>
) : null;

const Field = ({ label, icon: Icon, name, value, onChange, placeholder, required, type='text', rows }) => (
  <div>
    <label className="b-label">{label}{required && <span style={{ color:'#DC2626',marginLeft:3 }}>*</span>}</label>
    <div style={{ position:'relative' }}>
      <Icon size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C,opacity:.8 }} />
      {rows ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows}
          className="b-input" placeholder={placeholder}
          style={{ minHeight:64,resize:'vertical',paddingLeft:38,height:'auto' }} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required}
          className="b-input" placeholder={placeholder} style={{ paddingLeft:38 }} />
      )}
    </div>
  </div>
);

// ─── Branch Card ─────────────────────────────────────────────────────
const BranchCard = ({ b, onEdit, onDelete, idx }) => (
  <div className="b-card" style={{ padding:24,animationDelay:`${idx*0.07}s` }}>
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:12,flexWrap:'wrap' }}>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:48,height:48,borderRadius:10,background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <Building2 size={24} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize:16,fontWeight:600,margin:0,color:'#111827',lineHeight:1.3 }}>{b.name}</h3>
          {b.code && <span style={{ fontSize:12,color:'#2563EB',fontWeight:600,fontFamily:'monospace' }}>#{b.code}</span>}
        </div>
      </div>
      <span className={b.is_active ? 'b-badge-active' : 'b-badge-inactive'}>
        {b.is_active ? <CheckCircle size={11}/> : <XCircle size={11}/>}
        {b.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>

    <div style={{ display:'flex',flexDirection:'column',gap:8,fontSize:13,color:'#6B7280',lineHeight:1.5 }}>
      {b.phone        && <div style={{ display:'flex',alignItems:'center',gap:8 }}><Phone   size={14} color={C} />{b.phone}</div>}
      {b.manager_name && <div style={{ display:'flex',alignItems:'center',gap:8 }}><User    size={14} color={C} />{b.manager_name}</div>}
      {b.working_hours&& <div style={{ display:'flex',alignItems:'center',gap:8 }}><Clock   size={14} color={C} />{b.working_hours}</div>}
      {b.address      && <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}><MapPin size={14} color={C} style={{ marginTop:2 }} />{b.address}</div>}
    </div>

    <div style={{ display:'flex',gap:10,marginTop:18,paddingTop:14,borderTop:`1px solid ${CL}` }}>
      <button onClick={() => onEdit(b)} className="btn-olive btn-gold" style={{ flex:1,height:40 }}>
        <Edit3 size={14}/> Edit
      </button>
      <button onClick={() => onDelete(b.id)} className="btn-danger" style={{ flex:1,height:40 }}>
        <Trash2 size={14}/> Delete
      </button>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────
const RetailBranches = () => {
  const [branches,   setBranches]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [msg,        setMsg]        = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // id to delete

  const EMPTY = { name:'', code:'', address:'', phone:'', working_hours:'', manager_name:'', is_active:true };
  const [formData, setFormData] = useState(EMPTY);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/retail/branches');
      const list = Array.isArray(res) ? res : res?.data || [];
      setBranches(list);
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
      if (editing) { await apiClient.put(`/retail/branches/${editing}`, formData); showMsg('success', 'Branch updated!'); }
      else         { await apiClient.post('/retail/branches', formData);           showMsg('success', 'Branch created!'); }
      handleCancel(); fetchBranches();
    } catch (err) { showMsg('error', err.response?.data?.message || 'Failed to save branch'); }
    finally { setSaving(false); }
  };

  const handleDelete = id => setConfirmDel(id);
  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/retail/branches/${confirmDel}`);
      showMsg('success', 'Branch deleted');
      fetchBranches();
    } catch { showMsg('error', 'Failed to delete branch'); }
    finally { setConfirmDel(null); }
  };

  // ── render ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding:0,margin:0,boxSizing:'border-box',width:'100%',minHeight:'100vh',background:'#F5F6FA',fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <style>{SHARED_CSS}</style>
      <Toast msg={msg} />
      {confirmDel && <ConfirmModal text="Delete this branch? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)} />}

      <div className="b-page">
        {/* ── HEADER ── */}
        <div className="b-head" style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:24,animation:'fadeUp .35s ease' }}>
          <div>
            <h1 className="artistic-title">
              Branches <Building2 style={{ color:C }} size={30}/>
            </h1>
            <p className="artistic-subtitle">Sales Location Network</p>
          </div>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            <button onClick={fetchBranches} className="btn-olive">
              {loading ? <SegmentedSpinner size={16} /> : <RotateCcw size={16}/>}
              Refresh
            </button>
            <button onClick={() => showForm ? handleCancel() : openForm()} className="btn-olive-primary btn-gold">
              {showForm ? <X size={16}/> : <Plus size={16}/>}
              {showForm ? 'Cancel' : 'Add Branch'}
            </button>
          </div>
        </div>

        {/* ── INFO BAR ── */}
        <div className="b-card" style={{ padding:20,marginBottom:24,display:'flex',gap:16,alignItems:'center',animationDelay:'0s' }}>
          <div style={{ background:'#2563EB',color:'white',padding:12,borderRadius:10,flexShrink:0 }}>
            <ShieldCheck size={22}/>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ margin:'0 0 3px',fontSize:14,fontWeight:600,color:'#111827',textTransform:'uppercase',letterSpacing:'.04em' }}>Manage Your Branch Network</h3>
            <p style={{ margin:0,fontSize:13,color:'#6B7280',lineHeight:1.5 }}>
              Add, edit, or remove sales locations. Each branch has its own contact details and working hours.
            </p>
          </div>
          <span style={{ marginLeft:'auto',padding:'4px 12px',borderRadius:999,background:'#EFF6FF',color:'#2563EB',fontWeight:600,fontSize:13,whiteSpace:'nowrap' }}>
            {branches.length} {branches.length===1?'Branch':'Branches'}
          </span>
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div className="b-card" style={{ padding:24,marginBottom:28,animationDelay:'0s',overflow:'visible' }}>
            <div style={{ padding:'16px 24px',background:'#1D4ED8',color:'white',display:'flex',alignItems:'center',gap:12,margin:'-24px -24px 24px',borderRadius:'10px 10px 0 0' }}>
              {editing ? <Edit3 size={18}/> : <Plus size={18}/>}
              <span style={{ fontSize:15,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase' }}>
                {editing ? 'Edit Branch' : 'New Branch'}
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16 }}>
                <Field label="Branch Name" icon={Building2} name="name"         value={formData.name}          onChange={handleChange} placeholder="e.g. Downtown Sales" required />
                <Field label="Code"        icon={Hash}       name="code"         value={formData.code}          onChange={handleChange} placeholder="e.g. DTP" />
                <Field label="Phone"       icon={Phone}      name="phone"        value={formData.phone}         onChange={handleChange} placeholder="+251-XXX-XXXX" />
                <Field label="Manager Name"icon={User}       name="manager_name" value={formData.manager_name}  onChange={handleChange} placeholder="Manager name" />
                <Field label="Working Hours"icon={Clock}     name="working_hours"value={formData.working_hours} onChange={handleChange} placeholder="Mon-Sat 8AM-6PM" />
                <div style={{ display:'flex',alignItems:'flex-end',paddingBottom:4 }}>
                  <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'12px 0',userSelect:'none' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                      style={{ width:18,height:18,accentColor:C,cursor:'pointer' }}/>
                    <span style={{ fontSize:14,fontWeight:500,color:'#6B7280' }}>Active Branch</span>
                  </label>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <Field label="Address" icon={MapPin} name="address" value={formData.address} onChange={handleChange} placeholder="Full address" rows={2} />
                </div>
              </div>

              <div style={{ display:'flex',gap:12,marginTop:24,flexWrap:'wrap' }}>
                <button type="submit" disabled={saving} className="btn-olive-primary btn-gold">
                  {saving ? <SegmentedSpinner size={16} /> : <Save size={16}/>}
                  {saving ? 'Saving...' : editing ? 'Update Branch' : 'Create Branch'}
                </button>
                <button type="button" onClick={handleCancel} className="btn-olive">
                  <X size={16}/> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── BRANCH GRID ── */}
        {loading ? (
          <div style={{ padding:'80px 20px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center' }}>
            <SegmentedSpinner size={40} />
            <div style={{ fontSize:14,color:'#6B7280',marginTop:12,fontWeight:500 }}>Loading Branches…</div>
          </div>
        ) : branches.length === 0 ? (
          <div className="b-card" style={{ padding:'80px 24px',textAlign:'center' }}>
            <div style={{ width:64,height:64,borderRadius:999,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
              <Building2 size={30} color="#2563EB"/>
            </div>
            <h3 style={{ fontSize:18,fontWeight:600,color:'#111827',margin:'0 0 6px' }}>No Branches Yet</h3>
            <p style={{ color:'#6B7280',fontSize:14,margin:0 }}>Click <strong style={{ fontWeight:600 }}>Add Branch</strong> to register your first sales location.</p>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20 }}>
            {branches.map((b, i) => (
              <BranchCard key={b.id} b={b} idx={i} onEdit={openForm} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailBranches;
