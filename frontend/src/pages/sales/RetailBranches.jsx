import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, X, Edit3, Trash2, MapPin, Phone, Clock,
  User, Hash, CheckCircle, XCircle, Loader2, Save, RotateCcw,
  ShieldCheck, Zap, AlertTriangle
} from 'lucide-react';
import apiClient from '../../services/apiClient';

// ─── accent colour ──────────────────────────────────────────────────
const C   = '#B9B979';            // primary accent
const CD  = '#8f8f47';            // darker shade (shadow depth)
const CL  = 'rgba(185,185,121,0.15)'; // light tint

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)}     50%{opacity:.5;transform:scale(.9)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes fadeIn   { to{opacity:1} }
  @keyframes laserSweep { 0%{left:-150%} 100%{left:150%} }

  .b-card {
    --hc:${C};
    position:relative;overflow:hidden;background:white;border-radius: 0;
    box-shadow:0 2px 14px rgba(0,80,0,0.07);
    transition:background-size .4s,box-shadow .4s;animation:fadeUp .5s ease both;
    background-image:linear-gradient(to right,var(--hc),var(--hc)),
                     linear-gradient(to bottom,var(--hc),var(--hc)),
                     linear-gradient(to left,var(--hc),var(--hc)),
                     linear-gradient(to top,var(--hc),var(--hc));
    background-position:0 0,100% 0,100% 100%,0 100%;
    background-repeat:no-repeat;
    background-size:0% 4px,4px 0%,0% 4px,4px 0%;
  }
  .b-card:hover{
    box-shadow:0 8px 28px rgba(0,80,0,0.13),0 0 18px var(--hc);
    background-size:100% 4px,4px 100%,100% 4px,4px 100%;
  }
  .b-card::before{
    content:'';position:absolute;top:0;left:-150%;width:60%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
    transform:skewX(-20deg);transition:none;pointer-events:none;z-index:1;
  }
  .b-card:hover::before{ animation:laserSweep 0.7s ease forwards; }

  .btn-olive {
    display:inline-flex;align-items:center;gap:8px;
    padding:11px 22px;font-weight:900;font-size:14px;cursor:pointer;
    letter-spacing:.08em;text-transform:uppercase;
    background:linear-gradient(135deg,#fff,#f5f5dc);color:#3a3a00;
    border:2px solid ${C};border-radius: 0;
    box-shadow:0 5px 0 ${CD},0 8px 15px rgba(143,143,71,.18),inset 0 2px 0 rgba(255,255,255,1);
    transition:all .1s;font-family:'Inter','Segoe UI',sans-serif;
  }
  .btn-olive:active:not(:disabled){ transform:translateY(5px);box-shadow:0 0 0 ${CD}; }
  .btn-olive:hover:not(:disabled) { filter:brightness(1.05); }
  .btn-olive:disabled             { filter:grayscale(.7) opacity(.7);cursor:not-allowed;transform:translateY(5px);box-shadow:0 0 0 ${CD}; }

  .btn-olive-primary {
    display:inline-flex;align-items:center;gap:10px;
    padding:12px 28px;font-weight:900;font-size:15px;cursor:pointer;
    letter-spacing:.12em;text-transform:uppercase;
    background:linear-gradient(135deg,${C},${CD});color:white;
    border:2px solid ${CD};border-radius: 0;
    box-shadow:0 5px 0 #5c5c22,0 8px 15px rgba(92,92,34,.28),inset 0 2px 0 rgba(255,255,255,.2);
    transition:all .1s;font-family:'Inter','Segoe UI',sans-serif;
  }
  .btn-olive-primary:active:not(:disabled){ transform:translateY(5px);box-shadow:0 0 0 #5c5c22; }
  .btn-olive-primary:hover:not(:disabled) { filter:brightness(1.08); }
  .btn-olive-primary:disabled             { filter:grayscale(.8) opacity(.7);cursor:not-allowed;transform:translateY(5px);box-shadow:none; }

  .b-row { border-bottom:1px solid rgba(185,185,121,.15);transition:background .2s,transform .2s; }
  .b-row:hover { background:rgba(185,185,121,.08);transform:translateX(3px); }

  .b-input {
    width:100%;padding:12px 12px 12px 38px;border:2px solid #e9e9d0;border-radius: 0;
    font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;
    transition:border-color .2s,box-shadow .2s;
  }
  .b-input:focus { border-color:${C};box-shadow:0 0 0 3px ${CL}; }

  .b-label { display:block;font-size:11px;font-weight:900;color:#6b6b3a;margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em; }

  .b-badge-active   { padding:4px 12px;border-radius: 0;font-size:11px;font-weight:900;background:#f0f0d8;color:#5c5c22;display:inline-flex;align-items:center;gap:5px; }
  .b-badge-inactive { padding:4px 12px;border-radius: 0;font-size:11px;font-weight:900;background:#f5f5f5;color:#888;display:inline-flex;align-items:center;gap:5px; }

  .artistic-title {
    font-size:2.8rem;font-weight:900;color:#2a2a00;letter-spacing:-.02em;
    text-shadow:1px 1px 0 #fff,2px 2px 0 #fff,3px 3px 0 ${C},4px 4px 0 ${C},5px 5px 0 ${CD},6px 6px 0 ${CD},7px 7px 15px rgba(0,0,0,.2);
    margin:0;display:flex;align-items:center;gap:12px;line-height:1.1;
  }
  .artistic-subtitle {
    font-size:.95rem;color:#8a8a50;font-weight:800;text-align:center;
    text-transform:uppercase;letter-spacing:.15em;margin:0;
    text-shadow:1px 1px 0 rgba(255,255,255,.9);
  }
`;

// ─── Confirm delete modal ────────────────────────────────────────────
const ConfirmModal = ({ text, onConfirm, onCancel }) => (
  <div style={{ position:'fixed',inset:0,background:'rgba(42,42,0,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,animation:'fadeIn .2s ease' }}>
    <div style={{ background:'white',padding:'32px 40px',borderRadius: 0,boxShadow:'0 20px 40px rgba(0,0,0,.2)',maxWidth:420,animation:'fadeUp .3s ease' }}>
      <AlertTriangle size={36} color={C} style={{ marginBottom:14 }} />
      <h2 style={{ margin:'0 0 12px',fontSize:20,fontWeight:900,color:'#2a2a00' }}>Are you sure?</h2>
      <p style={{ margin:'0 0 24px',fontSize:14,color:'#6b6b3a',lineHeight:1.6 }}>{text}</p>
      <div style={{ display:'flex',gap:12,justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ padding:'10px 20px',borderRadius: 0,border:'2px solid #e9e9d0',background:'transparent',color:'#888',fontWeight:800,cursor:'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding:'10px 20px',borderRadius: 0,border:'none',background:'#e11d48',color:'white',fontWeight:800,cursor:'pointer',boxShadow:'0 4px 12px rgba(225,29,72,.3)' }}>Delete</button>
      </div>
    </div>
  </div>
);

// ─── Inline Toast ────────────────────────────────────────────────────
const Toast = ({ msg }) => msg?.text ? (
  <div style={{ position:'fixed',top:20,right:20,zIndex:9999,padding:'14px 22px',borderRadius: 0,
    background: msg.type==='success' ? '#f0f0d8' : '#fef2f2',
    border:`2px solid ${msg.type==='success' ? C : '#fca5a5'}`,
    color: msg.type==='success' ? '#3a3a00' : '#991b1b',
    fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:10,
    boxShadow:`0 8px 24px rgba(0,0,0,.12)`,animation:'fadeUp .3s ease'
  }}>
    {msg.type==='success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
    {msg.text}
  </div>
) : null;

// ─── Field helper ────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, name, value, onChange, placeholder, required, type='text', rows }) => (
  <div>
    <label className="b-label">{label}{required && <span style={{ color:'#e11d48',marginLeft:3 }}>*</span>}</label>
    <div style={{ position:'relative' }}>
      <Icon size={15} style={{ position:'absolute',left:12,top:14,color:C,opacity:.8 }} />
      {rows ? (
        <textarea name={name} value={value} onChange={onChange} rows={rows}
          className="b-input" placeholder={placeholder}
          style={{ minHeight:64,resize:'vertical',paddingLeft:38 }} />
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
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:48,height:48,borderRadius: 0,background:`linear-gradient(135deg,${C},${CD})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 5px 14px rgba(185,185,121,.45)`,flexShrink:0 }}>
          <Building2 size={24} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize:16,fontWeight:900,margin:0,color:'#2a2a00' }}>{b.name}</h3>
          {b.code && <span style={{ fontSize:12,color:C,fontWeight:800,fontFamily:'monospace' }}>#{b.code}</span>}
        </div>
      </div>
      <span className={b.is_active ? 'b-badge-active' : 'b-badge-inactive'}>
        {b.is_active ? <CheckCircle size={11}/> : <XCircle size={11}/>}
        {b.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>

    <div style={{ display:'flex',flexDirection:'column',gap:8,fontSize:13,color:'#6b6b3a' }}>
      {b.phone        && <div style={{ display:'flex',alignItems:'center',gap:8 }}><Phone   size={14} color={C} />{b.phone}</div>}
      {b.manager_name && <div style={{ display:'flex',alignItems:'center',gap:8 }}><User    size={14} color={C} />{b.manager_name}</div>}
      {b.working_hours&& <div style={{ display:'flex',alignItems:'center',gap:8 }}><Clock   size={14} color={C} />{b.working_hours}</div>}
      {b.address      && <div style={{ display:'flex',alignItems:'flex-start',gap:8 }}><MapPin size={14} color={C} style={{ marginTop:2 }} />{b.address}</div>}
    </div>

    <div style={{ display:'flex',gap:10,marginTop:18,paddingTop:14,borderTop:`1px solid ${CL}` }}>
      <button onClick={() => onEdit(b)} style={{
        flex:1,padding:'10px 12px',
        background:`linear-gradient(135deg,#fafad2,#f5f5c0)`,color:CD,
        border:`2px solid ${C}`,borderRadius: 0,cursor:'pointer',fontWeight:800,fontSize:12,
        display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        boxShadow:`0 3px 0 ${CD}`,transition:'all .1s'
      }}
        onMouseDown={e => { e.currentTarget.style.transform='translateY(3px)'; e.currentTarget.style.boxShadow='0 0 0 transparent'; }}
        onMouseUp={e   => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 3px 0 ${CD}`; }}
        onMouseLeave={e=> { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`0 3px 0 ${CD}`; }}
      >
        <Edit3 size={13}/> Edit
      </button>
      <button onClick={() => onDelete(b.id)} style={{
        flex:1,padding:'10px 12px',
        background:'linear-gradient(135deg,#fff5f5,#fee2e2)',color:'#e11d48',
        border:'2px solid #fca5a5',borderRadius: 0,cursor:'pointer',fontWeight:800,fontSize:12,
        display:'flex',alignItems:'center',justifyContent:'center',gap:6,
        boxShadow:'0 3px 0 #fca5a5',transition:'all .1s'
      }}
        onMouseDown={e => { e.currentTarget.style.transform='translateY(3px)'; e.currentTarget.style.boxShadow='0 0 0 transparent'; }}
        onMouseUp={e   => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 3px 0 #fca5a5'; }}
        onMouseLeave={e=> { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 3px 0 #fca5a5'; }}
      >
        <Trash2 size={13}/> Delete
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
    <div style={{ padding:0,minHeight:'calc(100vh - 64px)',background:'#EFEFD9',fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <style>{SHARED_CSS}</style>
      <Toast msg={msg} />
      {confirmDel && <ConfirmModal text="Delete this branch? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setConfirmDel(null)} />}

      {/* ── HEADER ── */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',marginBottom:'2.5rem',marginTop:'0.5rem',animation:'fadeUp .35s ease' }}>
        <div style={{ justifySelf:'start' }}>
          <h1 className="artistic-title">
            Branches. <Building2 style={{ color:C,filter:`drop-shadow(0 0 8px ${C})` }} size={38}/>
          </h1>
        </div>
        <div style={{ justifySelf:'center' }}>
          <p className="artistic-subtitle">Sales Location Network</p>
        </div>
        <div style={{ justifySelf:'end',display:'flex',gap:12 }}>
          <button onClick={fetchBranches} style={{
            display:'inline-flex',alignItems:'center',gap:8,padding:'11px 22px',
            background:'linear-gradient(135deg,#fff,#f5f5dc)',color:'#3a3a00',
            border:`2px solid ${C}`,borderRadius: 0,fontWeight:900,fontSize:14,cursor:'pointer',
            letterSpacing:'.08em',textTransform:'uppercase',
            boxShadow:`0 5px 0 ${CD},0 8px 15px rgba(143,143,71,.18),inset 0 2px 0 rgba(255,255,255,1)`,
            transition:'all .1s',fontFamily:"'Inter',sans-serif"
          }}
            onMouseDown={e=>{e.currentTarget.style.transform='translateY(5px)';e.currentTarget.style.boxShadow=`0 0 0 ${CD}`;}}
            onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`0 5px 0 ${CD},0 8px 15px rgba(143,143,71,.18),inset 0 2px 0 rgba(255,255,255,1)`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`0 5px 0 ${CD},0 8px 15px rgba(143,143,71,.18),inset 0 2px 0 rgba(255,255,255,1)`;}}
          >
            <RotateCcw size={16}/> Refresh
          </button>
          <button onClick={() => showForm ? handleCancel() : openForm()} className="btn-olive-primary">
            {showForm ? <X size={18}/> : <Plus size={18}/>}
            {showForm ? 'Cancel' : 'Add Branch'}
          </button>
        </div>
      </div>

      {/* ── INFO BAR ── */}
      <div style={{ background:'rgba(255,255,255,.55)',border:'2px solid rgba(255,255,255,1)',borderRadius: 0,padding:'18px 28px',marginBottom:24,display:'flex',gap:16,alignItems:'center',boxShadow:'0 10px 30px rgba(0,80,0,.04)',animation:'fadeUp .4s ease' }}>
        <div style={{ background:`linear-gradient(135deg,${C},${CD})`,color:'white',padding:12,borderRadius: 0,boxShadow:`0 4px 12px rgba(185,185,121,.45)`,flexShrink:0 }}>
          <ShieldCheck size={22}/>
        </div>
        <div>
          <h3 style={{ margin:'0 0 3px',fontSize:14,fontWeight:900,color:'#2a2a00',textTransform:'uppercase',letterSpacing:'.05em' }}>Manage Your Branch Network</h3>
          <p style={{ margin:0,fontSize:13,color:'#8a8a50',fontWeight:600 }}>
            Add, edit, or remove sales locations. Each branch has its own contact details and working hours.
            <span style={{ marginLeft:10,padding:'2px 10px',borderRadius: 0,background:CL,color:CD,fontWeight:800,fontSize:12 }}>
              {branches.length} {branches.length===1?'Branch':'Branches'}
            </span>
          </p>
        </div>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="b-card" style={{ padding:28,marginBottom:28,animationDelay:'0s',overflow:'visible' }}>
          <div style={{ padding:'18px 28px',background:`linear-gradient(135deg,${C},${CD})`,color:'white',display:'flex',alignItems:'center',gap:12,margin:'-28px -28px 24px',borderRadius: 0 }}>
            {editing ? <Edit3 size={20}/> : <Plus size={20}/>}
            <span style={{ fontSize:16,fontWeight:900,letterSpacing:'.05em',textTransform:'uppercase' }}>
              {editing ? 'Edit Branch' : 'New Branch'}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:18 }}>
              <Field label="Branch Name" icon={Building2} name="name"         value={formData.name}          onChange={handleChange} placeholder="e.g. Downtown Sales" required />
              <Field label="Code"        icon={Hash}       name="code"         value={formData.code}          onChange={handleChange} placeholder="e.g. DTP" />
              <Field label="Phone"       icon={Phone}      name="phone"        value={formData.phone}         onChange={handleChange} placeholder="+251-XXX-XXXX" />
              <Field label="Manager Name"icon={User}       name="manager_name" value={formData.manager_name}  onChange={handleChange} placeholder="Manager name" />
              <Field label="Working Hours"icon={Clock}     name="working_hours"value={formData.working_hours} onChange={handleChange} placeholder="Mon-Sat 8AM-6PM" />
              <div style={{ display:'flex',alignItems:'flex-end',paddingBottom:4 }}>
                <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'12px 0',userSelect:'none' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                    style={{ width:18,height:18,accentColor:C,cursor:'pointer' }}/>
                  <span style={{ fontSize:14,fontWeight:800,color:'#3a3a00' }}>Active Branch</span>
                </label>
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <Field label="Address" icon={MapPin} name="address" value={formData.address} onChange={handleChange} placeholder="Full address" rows={2} />
              </div>
            </div>

            <div style={{ display:'flex',gap:12,marginTop:24 }}>
              <button type="submit" disabled={saving} className="btn-olive-primary">
                {saving ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={16}/>}
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
          <Zap size={40} style={{ color:C,marginBottom:16,animation:'pulse 1.5s ease-in-out infinite' }}/>
          <div style={{ fontSize:18,color:'#2a2a00',fontWeight:900 }}>Loading Branches...</div>
        </div>
      ) : branches.length === 0 ? (
        <div className="b-card" style={{ padding:'80px 24px',textAlign:'center' }}>
          <Building2 size={56} style={{ color:C,opacity:.4,marginBottom:16 }}/>
          <h3 style={{ fontSize:18,fontWeight:900,color:'#6b6b3a',margin:'0 0 6px' }}>No Branches Yet</h3>
          <p style={{ color:'#a0a07a',fontSize:14,margin:0 }}>Click <strong>Add Branch</strong> to register your first sales location.</p>
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20 }}>
          {branches.map((b, i) => (
            <BranchCard key={b.id} b={b} idx={i} onEdit={openForm} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RetailBranches;
